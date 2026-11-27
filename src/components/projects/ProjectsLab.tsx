
"use client";

import { useEffect, useState, useRef } from "react";

import {
  Plus,
  Search,
  Layers3,
  ListTodo,
  CheckCircle2,
  FolderKanban,
  Star,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";

import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  deleteTask,
  getProjectProgress,
  PROJECT_STATUS,
  type ProjectWithTasks,
  type ProjectTask,
  type TaskStatus,
} from "@/services/projects";

import ProjectForm, {
  type ProjectFormData,
} from "./ProjectForm";

import TaskForm, {
  type TaskFormData,
} from "./TaskForm";

import ProjectBoard from "./ProjectBoard";

type ProjectModal =
  | { mode: "create" }
  | { mode: "edit"; project: ProjectWithTasks }
  | null;

type TaskModal =
  | { mode: "create"; status: TaskStatus }
  | { mode: "edit"; task: ProjectTask }
  | null;

export default function ProjectsLab() {
  const [projects, setProjects] =
    useState<ProjectWithTasks[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const busyRef = useRef(false);

  const [projectModal, setProjectModal] =
    useState<ProjectModal>(null);

  const [taskModal, setTaskModal] =
    useState<TaskModal>(null);

  const selected = projects.find(
    (project) => project.id === selectedId
  );

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

    listProjects()
      .then((rows) => {
        if (active) setProjects(rows);
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

  function saveProject(data: ProjectFormData) {
    const modal = projectModal;

    if (!modal) return;

    void run(async () => {
      if (modal.mode === "create") {
        const created = await createProject(data);

        setProjects((items) => [
          created,
          ...items,
        ]);

        setSelectedId(created.id);
      } else {
        const updated = await updateProject(
          modal.project.id,
          data
        );

        setProjects((items) =>
          items.map((project) =>
            project.id === updated.id
              ? { ...project, ...updated }
              : project
          )
        );
      }

      setProjectModal(null);
    });
  }

  function removeProject(id: string) {
    if (
      !window.confirm(
        "Excluir este projeto e todas as suas tarefas?"
      )
    ) {
      return;
    }

    void run(async () => {
      await deleteProject(id);

      setProjects((items) =>
        items.filter((project) => project.id !== id)
      );

      setSelectedId(null);
    });
  }

  function toggleFavorite(project: ProjectWithTasks) {
    void run(async () => {
      const updated = await updateProject(
        project.id,
        { favorite: !project.favorite }
      );

      setProjects((items) =>
        items.map((item) =>
          item.id === updated.id
            ? { ...item, ...updated }
            : item
        )
      );
    });
  }

  function saveTask(data: TaskFormData) {
    const modal = taskModal;
    const projectId = selectedId;

    if (!modal || !projectId) return;

    void run(async () => {
      const task =
        modal.mode === "create"
          ? await createTask(projectId, data)
          : await updateTask(modal.task.id, data);

      setProjects((items) =>
        items.map((project) => {
          if (project.id !== projectId) return project;

          const tasks = project.project_tasks;

          return {
            ...project,
            project_tasks:
              modal.mode === "create"
                ? [...tasks, task]
                : tasks.map((item) =>
                  item.id === task.id ? task : item
                ),
          };
        })
      );

      setTaskModal(null);
    });
  }

  function moveTask(id: string, status: TaskStatus) {
    const task = selected?.project_tasks.find(
      (item) => item.id === id
    );

    if (!task || task.status === status) return;

    void run(async () => {
      const updated = await updateTask(id, { status });

      setProjects((items) =>
        items.map((project) =>
          project.id === updated.project_id
            ? {
              ...project,
              project_tasks: project.project_tasks.map(
                (item) =>
                  item.id === updated.id
                    ? updated
                    : item
              ),
            }
            : project
        )
      );
    });
  }

  function removeTask(id: string) {
    if (!window.confirm("Excluir esta tarefa?")) {
      return;
    }

    void run(async () => {
      await deleteTask(id);

      setProjects((items) =>
        items.map((project) => ({
          ...project,
          project_tasks: project.project_tasks.filter(
            (task) => task.id !== id
          ),
        }))
      );
    });
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      `${project.title} ${project.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "favorites" && project.favorite) ||
      project.status === filter;

    return matchesSearch && matchesFilter;
  });

  const activeProjects = projects.filter(
    (project) => project.status === "em_andamento"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "concluido"
  ).length;

  const pendingTasks = projects
    .flatMap((project) => project.project_tasks)
    .filter((task) => task.status !== "done")
    .length;

  const stats = [
    {
      label: "Projetos ativos",
      value: activeProjects,
      icon: Layers3,
      color: "#E97836",
    },
    {
      label: "Tarefas pendentes",
      value: pendingTasks,
      icon: ListTodo,
      color: "#647EAE",
    },
    {
      label: "Projetos concluídos",
      value: completedProjects,
      icon: CheckCircle2,
      color: "#477B61",
    },
  ];

  return (
    <section className="projects-lab">
      {error && (
        <p className="project-error" role="alert">
          {error}
        </p>
      )}

      {selected ? (
        <ProjectBoard
          project={selected}
          busy={busy}
          onBack={() => setSelectedId(null)}
          onEdit={() =>
            setProjectModal({
              mode: "edit",
              project: selected,
            })
          }
          onFavorite={() => toggleFavorite(selected)}
          onDelete={() => removeProject(selected.id)}
          onCreateTask={(status) =>
            setTaskModal({ mode: "create", status })
          }
          onEditTask={(task) =>
            setTaskModal({ mode: "edit", task })
          }
          onDeleteTask={removeTask}
          onMoveTask={moveTask}
        />
      ) : (
        <>
          <div className="project-stats">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <article key={label} className="project-stat">
                <div
                  className="project-stat-icon"
                  style={{
                    color,
                    background: `${color}18`,
                  }}
                >
                  <Icon size={19} strokeWidth={1.7} />
                </div>

                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>

          <div className="projects-toolbar">
            <div className="project-search">
              <Search size={16} />

              <input
                value={search}
                placeholder="Buscar projetos..."
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todos os projetos</option>
              <option value="favorites">Favoritos</option>

              {Object.entries(PROJECT_STATUS).map(
                ([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                )
              )}
            </select>

            <button
              className="project-primary-button"
              disabled={busy || loading}
              onClick={() =>
                setProjectModal({ mode: "create" })
              }
            >
              <Plus size={17} />
              Novo projeto
            </button>
          </div>

          {loading ? (
            <div className="projects-empty">
              Carregando projetos...
            </div>
          ) : filteredProjects.length ? (
            <div className="projects-grid">
              {filteredProjects.map((project) => {
                const progress = getProjectProgress(
                  project.project_tasks
                );

                return (
                  <article
                    key={project.id}
                    className="project-card"
                  >
                    <div className="project-card-top">
                      <div
                        className="project-card-icon"
                        style={{
                          background: `${project.color}18`,
                          color: project.color,
                        }}
                      >
                        <FolderKanban
                          size={22}
                          strokeWidth={1.7}
                        />
                      </div>

                      <button
                        disabled={busy}
                        aria-label="Favoritar projeto"
                        onClick={() => toggleFavorite(project)}
                      >
                        <Star
                          size={17}
                          fill={
                            project.favorite
                              ? "#E97836"
                              : "none"
                          }
                        />
                      </button>
                    </div>

                    <button
                      className="project-card-title"
                      onClick={() =>
                        setSelectedId(project.id)
                      }
                    >
                      {project.title}
                      <ArrowUpRight size={16} />
                    </button>

                    <p>
                      {project.description || "Sem descrição"}
                    </p>

                    <span className="project-status">
                      <i
                        style={{
                          background:
                            PROJECT_STATUS[project.status].color,
                        }}
                      />

                      {PROJECT_STATUS[project.status].label}
                    </span>

                    <div className="project-progress-track">
                      <div
                        style={{
                          background: project.color,
                          width: `${progress.percentage}%`,
                        }}
                      />
                    </div>

                    <div className="project-card-progress">
                      <span>
                        {progress.completed} de {progress.total}
                        {" "}tarefas
                      </span>

                      <strong>{progress.percentage}%</strong>
                    </div>

                    <footer className="project-card-footer">
                      <span>
                        <CalendarDays size={14} />

                        {project.due_date
                          ? new Date(
                            `${project.due_date}T12:00:00`
                          ).toLocaleDateString("pt-BR")
                          : "Sem prazo"}
                      </span>

                      <button
                        onClick={() =>
                          setSelectedId(project.id)
                        }
                      >
                        Abrir projeto
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="projects-empty">
              <FolderKanban
                size={44}
                strokeWidth={1.3}
              />

              <h3>
                {projects.length
                  ? "Nenhum projeto encontrado"
                  : "Seu próximo projeto começa aqui."}
              </h3>

              <p>
                Organize objetivos e transforme ideias
                em resultados.
              </p>

              <button
                className="project-primary-button"
                disabled={busy}
                onClick={() =>
                  setProjectModal({ mode: "create" })
                }
              >
                <Plus size={16} />
                Criar projeto
              </button>
            </div>
          )}
        </>
      )}

      {projectModal && (
        <ProjectForm
          project={
            projectModal.mode === "edit"
              ? projectModal.project
              : undefined
          }
          busy={busy}
          onClose={() => setProjectModal(null)}
          onSubmit={saveProject}
        />
      )}

      {taskModal && (
        <TaskForm
          task={
            taskModal.mode === "edit"
              ? taskModal.task
              : undefined
          }
          initialStatus={
            taskModal.mode === "create"
              ? taskModal.status
              : undefined
          }
          busy={busy}
          onClose={() => setTaskModal(null)}
          onSubmit={saveTask}
        />
      )}
    </section>
  );
}
