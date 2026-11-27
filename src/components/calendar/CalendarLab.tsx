
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";

import type { EventInput } from "@fullcalendar/react";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import GoogleCalendarIntegration from "@/components/integrations/GoogleCalendarIntegration";

import {
  Plus,
  Download,
  CalendarDays,
  Clock,
  MapPin,
  RefreshCw,
} from "lucide-react";

import {
  listEvents,
  saveEvent,
  updateEvent,
  deleteEvent,
  EVENT_CATEGORIES,
  type CalendarEvent,
  type EventFields,
} from "@/services/calendar";

import {
  listProjects,
  type ProjectWithTasks,
} from "@/services/projects";

import { exportCalendar } from "@/lib/calendar-export";

import EventForm from "./EventForm";

type ModalState = {
  event?: CalendarEvent;
  start: string;
  end?: string;
  allDay?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarLab() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [projects, setProjects] =
    useState<ProjectWithTasks[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("all");

  const [showDeadlines, setShowDeadlines] =
    useState(true);

  const [modal, setModal] =
    useState<ModalState | null>(null);

  const [version, setVersion] = useState(0);

  const [now, setNow] = useState<number | null>(null);

  const [deadline, setDeadline] =
    useState<EventInput | null>(null);

  const busyRef = useRef(false);

  function report(err: unknown) {
    setError(
      err &&
        typeof err === "object" &&
        "message" in err
        ? String(err.message)
        : "Não foi possível concluir a operação."
    );
  }

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setNow(Date.now());

    Promise.all([
      listEvents(),
      listProjects(),
    ])
      .then(([eventRows, projectRows]) => {
        if (!active) return;

        setEvents(eventRows);
        setProjects(projectRows);
      })
      .catch((err) => {
        if (active) report(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [version]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  async function run(action: () => Promise<void>) {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      await action();
    } catch (err) {
      report(err);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function newEvent() {
    const start = new Date();

    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);

    const end = new Date(start.getTime() + 3600000);

    setError("");

    setModal({
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
    });
  }

  function editEvent(event: CalendarEvent) {
    setError("");

    setModal({
      event,
      start: event.start_at,
      end: event.end_at ?? undefined,
      allDay: event.all_day,
    });
  }

  function handleSave(fields: EventFields) {
    const id = modal?.event?.id;

    void run(async () => {
      const saved = await saveEvent(fields, id);

      setEvents((items) =>
        id
          ? items.map((item) =>
            item.id === saved.id ? saved : item
          )
          : [...items, saved]
      );

      setModal(null);
    });
  }

  function handleDelete() {
    const id = modal?.event?.id;

    if (!id) return;

    if (!window.confirm("Excluir este evento?")) {
      return;
    }

    void run(async () => {
      await deleteEvent(id);

      setEvents((items) =>
        items.filter((item) => item.id !== id)
      );

      setModal(null);
    });
  }

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          category === "all" ||
          event.category === category
      ),
    [events, category]
  );

  const calendarEvents = useMemo<EventInput[]>(() => {
    const result: EventInput[] = filteredEvents.map(
      (event) => ({
        id: event.id,
        title: event.title,
        start: event.start_at,
        end: event.end_at ?? undefined,
        allDay: event.all_day,
        backgroundColor: `${event.color}20`,
        borderColor: event.color,
        textColor: event.color,
        editable: true,
        extendedProps: {
          kind: "event",
        },
      })
    );

    if (!showDeadlines) return result;

    projects.forEach((project) => {
      if (
        project.due_date &&
        project.status !== "concluido"
      ) {
        result.push({
          id: `project:${project.id}`,
          title: project.title,
          start: project.due_date,
          allDay: true,
          backgroundColor: `${project.color}20`,
          borderColor: project.color,
          textColor: project.color,
          editable: false,
          extendedProps: {
            kind: "project",
            description: project.description,
          },
        });
      }

      project.project_tasks.forEach((task) => {
        if (!task.due_date || task.status === "done") {
          return;
        }

        result.push({
          id: `task:${task.id}`,
          title: task.title,
          start: task.due_date,
          allDay: true,
          backgroundColor: "#E9783620",
          borderColor: "#E97836",
          textColor: "#C45D24",
          editable: false,
          extendedProps: {
            kind: "task",
            projectTitle: project.title,
            description: task.description,
          },
        });
      });
    });

    return result;
  }, [filteredEvents, projects, showDeadlines]);

  const upcoming = useMemo(() => {
    if (now === null) return [];

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return calendarEvents
      .filter((event) => {
        const start = new Date(String(event.start));

        if (
          typeof event.start === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(event.start)
        ) {
          return event.start >= [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0"),
          ].join("-");
        }

        return start.getTime() >= today.getTime();
      })
      .sort((a, b) =>
        String(a.start).localeCompare(String(b.start))
      )
      .slice(0, 6);
  }, [calendarEvents, now]);

  function openCalendarItem(id: string) {
    const event = events.find((item) => item.id === id);

    if (event) {
      editEvent(event);
      return;
    }

    const item = calendarEvents.find(
      (entry) => entry.id === id
    );

    if (item) setDeadline(item);
  }

  return (
    <section className="calendar-lab">
      <GoogleCalendarIntegration />
      {error && !modal && (
        <p className="project-error" role="alert">
          {error}
        </p>
      )}

      <div className="calendar-toolbar">
        <div className="calendar-toolbar-filters">
          <select
            aria-label="Filtrar categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas as categorias</option>

            {Object.keys(EVENT_CATEGORIES).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="calendar-deadline-toggle">
            <input
              type="checkbox"
              checked={showDeadlines}
              onChange={(e) =>
                setShowDeadlines(e.target.checked)
              }
            />

            Mostrar prazos
          </label>
        </div>

        <div className="calendar-toolbar-actions">
          <button
            className="project-secondary-button"
            disabled={loading || busy}
            title="Atualizar agenda"
            aria-label="Atualizar agenda"
            onClick={() => setVersion((v) => v + 1)}
          >
            <RefreshCw size={16} />
          </button>

          <button
            className="project-secondary-button"
            disabled={loading || !events.length}
            onClick={() => exportCalendar(events)}
          >
            <Download size={16} />
            Exportar
          </button>

          <button
            className="project-primary-button"
            disabled={loading || busy}
            onClick={newEvent}
          >
            <Plus size={17} />
            Novo evento
          </button>
        </div>
      </div>

      <div className="calendar-surface">
        {loading ? (
          <div className="calendar-loading">
            <div className="garden-loader" />
            <span>Carregando agenda...</span>
          </div>
        ) : (
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              classicThemePlugin,
            ]}
            locale="pt-BR"
            colorScheme="light"
            timeZone="local"
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttons={{
              today: { text: "Hoje" },
              dayGridMonth: { text: "Mês" },
              timeGridWeek: { text: "Semana" },
              timeGridDay: { text: "Dia" },
            }}
            events={calendarEvents}
            height="auto"
            dayMaxEvents={3}
            nowIndicator
            selectable={!busy}
            editable={!busy}
            selectMirror
            allDayText="Dia inteiro"
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            select={(info) => {
              setError("");

              setModal({
                start: info.start.toISOString(),
                end: info.end.toISOString(),
                allDay: info.allDay,
              });

              info.view.calendar.unselect();
            }}
            eventClick={(info) => {
              if (!busy) {
                openCalendarItem(info.event.id);
              }
            }}
            eventDrop={(info) => {
              if (
                busyRef.current ||
                info.event.extendedProps.kind !== "event" ||
                !info.event.start
              ) {
                info.revert();
                return;
              }

              const id = info.event.id;

              void run(async () => {
                try {
                  const updated = await updateEvent(id, {
                    start_at: info.event.start!.toISOString(),
                    end_at:
                      info.event.end?.toISOString() ?? null,
                    all_day: info.event.allDay,
                  });

                  setEvents((items) =>
                    items.map((item) =>
                      item.id === updated.id
                        ? updated
                        : item
                    )
                  );
                } catch (err) {
                  info.revert();
                  throw err;
                }
              });
            }}
            eventResize={(info) => {
              if (
                busyRef.current ||
                info.event.extendedProps.kind !== "event" ||
                !info.event.start
              ) {
                info.revert();
                return;
              }

              void run(async () => {
                try {
                  const updated = await updateEvent(
                    info.event.id,
                    {
                      start_at:
                        info.event.start!.toISOString(),
                      end_at:
                        info.event.end?.toISOString() ?? null,
                    }
                  );

                  setEvents((items) =>
                    items.map((item) =>
                      item.id === updated.id
                        ? updated
                        : item
                    )
                  );
                } catch (err) {
                  info.revert();
                  throw err;
                }
              });
            }}
          />
        )}
      </div>

      <div className="calendar-legend">
        {Object.entries(EVENT_CATEGORIES).map(
          ([label, color]) => (
            <span key={label}>
              <i style={{ background: color }} />
              {label}
            </span>
          )
        )}
      </div>

      <section className="calendar-upcoming">
        <header>
          <CalendarDays size={19} />
          <h3>Próximos compromissos</h3>
        </header>

        {!upcoming.length ? (
          <p className="calendar-empty">
            Nenhum compromisso próximo.
          </p>
        ) : (
          upcoming.map((item) => {
            const rawDate = String(item.start);

            const date = new Date(
              /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                ? `${rawDate}T12:00:00`
                : rawDate
            );

            const original = events.find(
              (event) => event.id === item.id
            );

            return (
              <button
                key={item.id}
                className="calendar-upcoming-item"
                onClick={() =>
                  openCalendarItem(String(item.id))
                }
              >
                <div className="calendar-day-badge">
                  <strong>{date.getDate()}</strong>

                  <span>
                    {date.toLocaleDateString("pt-BR", {
                      month: "short",
                    })}
                  </span>
                </div>

                <i
                  className="calendar-item-color"
                  style={{
                    background: item.borderColor ?? "#E97836",
                  }}
                />

                <div className="calendar-upcoming-info">
                  <strong>{item.title}</strong>

                  <span>
                    <Clock size={13} />

                    {item.extendedProps?.kind === "project"
                      ? "Prazo de projeto"
                      : item.extendedProps?.kind === "task"
                        ? "Prazo de tarefa"
                        : item.allDay
                          ? "Dia inteiro"
                          : formatTime(rawDate)}
                  </span>

                  {original?.location && (
                    <span>
                      <MapPin size={13} />
                      {original.location}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </section>

      {modal && (
        <EventForm
          event={modal.event}
          initialStart={modal.start}
          initialEnd={modal.end}
          initialAllDay={modal.allDay}
          busy={busy}
          error={error}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
          onDelete={handleDelete}
        />
      )}

      {deadline && (
        <div
          className="project-modal-overlay"
          onClick={() => setDeadline(null)}
        >
          <div
            className="project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deadline-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="project-modal-header">
              <div>
                <h2 id="deadline-title">{deadline.title}</h2>

                <p>
                  {deadline.extendedProps?.kind === "project"
                    ? "Prazo de projeto"
                    : "Prazo de tarefa"}
                </p>
              </div>
            </header>

            <p>
              {formatDate(
                `${String(deadline.start)}T12:00:00`
              )}
            </p>

            {deadline.extendedProps?.projectTitle && (
              <p>
                Projeto: {deadline.extendedProps.projectTitle}
              </p>
            )}

            <p>
              {deadline.extendedProps?.description ||
                "Sem descrição."}
            </p>

            <small className="calendar-hint">
              Para alterar este prazo, acesse a área de
              projetos.
            </small>

            <footer className="project-modal-footer">
              <button
                className="project-secondary-button"
                onClick={() => setDeadline(null)}
              >
                Fechar
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
