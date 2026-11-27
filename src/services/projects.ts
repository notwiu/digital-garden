
import { createClient } from "@/lib/supabase/client";
import { syncGoogleCalendarSafely } from "./google-calendar";

export type ProjectStatus =
  | "planejamento"
  | "em_andamento"
  | "pausado"
  | "concluido";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "done";

export type Priority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export const PROJECT_STATUS = {
  planejamento: {
    label: "Planejamento",
    color: "#92929B",
  },
  em_andamento: {
    label: "Em andamento",
    color: "#E97836",
  },
  pausado: {
    label: "Pausado",
    color: "#B99A57",
  },
  concluido: {
    label: "Concluído",
    color: "#477B61",
  },
} as const;

export const TASK_STATUS = {
  todo: {
    label: "A fazer",
    color: "#92929B",
  },
  in_progress: {
    label: "Em andamento",
    color: "#E97836",
  },
  done: {
    label: "Concluído",
    color: "#477B61",
  },
} as const;

export const PRIORITIES = {
  low: {
    label: "Baixa",
    color: "#92929B",
  },
  medium: {
    label: "Média",
    color: "#647EAE",
  },
  high: {
    label: "Alta",
    color: "#E97836",
  },
  urgent: {
    label: "Urgente",
    color: "#C94C4C",
  },
} as const;

export type Project = {
  id: string;
  title: string;
  description: string;
  color: string;
  status: ProjectStatus;
  due_date: string | null;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectTask = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectWithTasks = Project & {
  project_tasks: ProjectTask[];
};

type ProjectFields = Pick<
  Project,
  "title" | "description" | "color" |
  "status" | "due_date" | "favorite"
>;

type TaskFields = Pick<
  ProjectTask,
  "title" | "description" |
  "status" | "priority" | "due_date"
>;

async function context() {
  const db = createClient();

  const { data, error } = await db.auth.getUser();

  if (error || !data.user) {
    throw new Error("Sessão inválida.");
  }

  return {
    db,
    uid: data.user.id,
  };
}

export async function listProjects():
  Promise<ProjectWithTasks[]> {

  const { db, uid } = await context();

  const { data, error } = await db
    .from("projects")
    .select("*, project_tasks(*)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as ProjectWithTasks[];
}

export async function createProject(
  fields: Partial<ProjectFields>

): Promise<ProjectWithTasks> {

  const { db, uid } = await context();

  const { data, error } = await db
    .from("projects")
    .insert({
      ...fields,
      user_id: uid,
    })
    .select("*, project_tasks(*)")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();

  return data as ProjectWithTasks;
}

export async function updateProject(
  id: string,
  fields: Partial<ProjectFields>
): Promise<Project> {

  const { db, uid } = await context();

  const { data, error } = await db
    .from("projects")
    .update(fields)
    .eq("id", id)
    .eq("user_id", uid)
    .select("*")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();

  return data as Project;
}

export async function deleteProject(id: string) {
  const { db, uid } = await context();

  const { error } = await db
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select("id")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();
}

export async function createTask(
  projectId: string,
  fields: Partial<TaskFields> & { title: string }
): Promise<ProjectTask> {

  const { db } = await context();

  const { data, error } = await db
    .from("project_tasks")
    .insert({
      ...fields,
      project_id: projectId,
    })
    .select("*")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();

  return data as ProjectTask;
}

export async function updateTask(
  id: string,
  fields: Partial<TaskFields>
): Promise<ProjectTask> {

  const { db } = await context();

  const { data, error } = await db
    .from("project_tasks")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();

  return data as ProjectTask;
}

export async function deleteTask(id: string) {
  const { db } = await context();

  const { error } = await db
    .from("project_tasks")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;

  await syncGoogleCalendarSafely();
}

export function getProjectProgress(
  tasks: ProjectTask[]
) {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.status === "done"
  ).length;

  return {
    total,
    completed,
    percentage: total
      ? Math.round((completed / total) * 100)
      : 0,
  };
}
