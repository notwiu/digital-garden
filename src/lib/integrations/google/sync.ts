
import "server-only";

import { createHash } from "node:crypto";
import type { calendar_v3 } from "googleapis";

import { getGoogleCalendar } from "./calendar";

type EntityType = "event" | "project" | "task";

type SyncEntity = {
  id: string;
  type: EntityType;
  body: calendar_v3.Schema$Event;
};

type LocalEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
};

type LocalTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
};

type LocalProject = {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string | null;
  project_tasks: LocalTask[];
};

const TIME_ZONE = "America/Recife";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

function entityKey(type: EntityType, id: string) {
  return `${type}:${id}`;
}

function googleEventId(
  userId: string,
  type: EntityType,
  id: string
) {
  return createHash("sha256")
    .update(`${userId}:${type}:${id}`)
    .digest("hex");
}

function formatDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function nextDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

function metadata(type: EntityType, id: string) {
  return {
    private: {
      digitalGardenId: id,
      entityType: type,
    },
  };
}

function buildEvent(
  event: LocalEvent
): SyncEntity {
  const startDay = formatDay(event.start_at);

  const endDay = event.end_at
    ? formatDay(event.end_at)
    : nextDay(startDay);

  return {
    id: event.id,
    type: "event",
    body: {
      summary: event.title,
      description: event.description ?? "",
      location: event.location ?? "",

      start: event.all_day
        ? { date: startDay }
        : {
          dateTime: event.start_at,
          timeZone: TIME_ZONE,
        },

      end: event.all_day
        ? {
          date:
            endDay > startDay
              ? endDay
              : nextDay(startDay),
        }
        : {
          dateTime:
            event.end_at ??
            new Date(
              new Date(event.start_at).getTime() +
              3600000
            ).toISOString(),

          timeZone: TIME_ZONE,
        },

      extendedProperties: metadata("event", event.id),
    },
  };
}

function buildProject(
  project: LocalProject
): SyncEntity {
  const day = formatDay(project.due_date!);

  return {
    id: project.id,
    type: "project",

    body: {
      summary: `Projeto: ${project.title}`,

      description: [
        project.description ?? "",
        "",
        "Prazo de projeto — Digital Garden",
      ].join("\n"),

      start: { date: day },
      end: { date: nextDay(day) },

      colorId: "6",

      extendedProperties: metadata(
        "project",
        project.id
      ),
    },
  };
}

function buildTask(
  task: LocalTask,
  project: LocalProject
): SyncEntity {
  const day = formatDay(task.due_date!);

  return {
    id: task.id,
    type: "task",

    body: {
      summary: `Tarefa: ${task.title}`,

      description: [
        task.description ?? "",
        "",
        `Projeto: ${project.title}`,
        `Prioridade: ${PRIORITY_LABELS[task.priority] ?? task.priority
        }`,
        "",
        "Prazo de tarefa — Digital Garden",
      ].join("\n"),

      start: { date: day },
      end: { date: nextDay(day) },

      colorId:
        task.priority === "urgent" ? "11" : "3",

      extendedProperties: metadata(
        "task",
        task.id
      ),
    },
  };
}

function errorCode(error: unknown) {
  if (error && typeof error === "object") {
    const value = error as {
      code?: number;
      response?: { status?: number };
    };

    return Number(
      value.response?.status ?? value.code
    );
  }

  return 0;
}

export async function syncGoogleEvents(userId: string) {
  const { calendar, connection, db } =
    await getGoogleCalendar(userId);

  if (!connection.sync_enabled) {
    return {
      synced: 0,
      deleted: 0,
      skipped: true,
    };
  }

  const calendarId = connection.google_calendar_id;

  if (!calendarId) {
    throw new Error("Calendário não configurado.");
  }

  const [eventsResult, projectsResult, linksResult] =
    await Promise.all([
      db
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId),

      db
        .from("projects")
        .select("*, project_tasks(*)")
        .eq("user_id", userId),

      db
        .from("google_calendar_event_links")
        .select("*")
        .eq("user_id", userId)
        .eq("google_calendar_id", calendarId),
    ]);

  if (eventsResult.error) throw eventsResult.error;
  if (projectsResult.error) throw projectsResult.error;
  if (linksResult.error) throw linksResult.error;

  const events = (eventsResult.data ?? []) as LocalEvent[];

  const projects =
    (projectsResult.data ?? []) as LocalProject[];

  const links = linksResult.data ?? [];

  const entities: SyncEntity[] = events.map(buildEvent);

  for (const project of projects) {
    if (project.status === "concluido") continue;

    if (project.due_date) {
      entities.push(buildProject(project));
    }

    for (const task of project.project_tasks ?? []) {
      if (task.due_date && task.status !== "done") {
        entities.push(buildTask(task, project));
      }
    }
  }

  const activeKeys = new Set(
    entities.map((entity) =>
      entityKey(entity.type, entity.id)
    )
  );

  const linkMap = new Map(
    links.map((link) => [
      entityKey(
        link.entity_type as EntityType,
        link.entity_id
      ),
      link,
    ])
  );

  let synced = 0;
  let deleted = 0;

  for (const entity of entities) {
    const key = entityKey(entity.type, entity.id);
    const existing = linkMap.get(key);

    // Preserva vínculos existentes e permite recriar
    // prazos que tenham sido removidos anteriormente.
    const eventId =
      existing?.google_event_id ??
      googleEventId(
        userId,
        entity.type,
        entity.id
      );

    let result: calendar_v3.Schema$Event;

    try {
      const response = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: entity.body,
      });

      result = response.data;
    } catch (error) {
      if (![404, 410].includes(errorCode(error))) {
        throw error;
      }

      try {
        const response = await calendar.events.insert({
          calendarId,

          requestBody: {
            ...entity.body,
            id: eventId,
          },
        });

        result = response.data;
      } catch (insertError) {
        if (errorCode(insertError) !== 409) {
          throw insertError;
        }

        // Um evento excluído no Google pode manter
        // seu identificador reservado.
        const response = await calendar.events.insert({
          calendarId,
          requestBody: entity.body,
        });

        result = response.data;
      }
    }

    if (!result.id) {
      throw new Error("Evento sem identificador.");
    }

    const { error: linkError } = await db
      .from("google_calendar_event_links")
      .upsert(
        {
          user_id: userId,
          entity_type: entity.type,
          entity_id: entity.id,
          google_event_id: result.id,
          google_calendar_id: calendarId,
          google_etag: result.etag ?? null,
          last_synced_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,entity_type,entity_id",
        }
      );

    if (linkError) throw linkError;

    synced++;
  }

  for (const link of links) {
    const key = entityKey(
      link.entity_type as EntityType,
      link.entity_id
    );

    if (activeKeys.has(key)) continue;

    try {
      await calendar.events.delete({
        calendarId,
        eventId: link.google_event_id,
      });
    } catch (error) {
      if (![404, 410].includes(errorCode(error))) {
        throw error;
      }
    }

    const { error } = await db
      .from("google_calendar_event_links")
      .delete()
      .eq("id", link.id)
      .eq("user_id", userId);

    if (error) throw error;

    deleted++;
  }

  const { error: updateError } = await db
    .from("google_calendar_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return {
    synced,
    deleted,
    skipped: false,
  };
}
