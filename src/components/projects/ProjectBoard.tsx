
"use client";

import { useState } from "react";

import {
  ArrowLeft,
  Plus,
  CalendarDays,
  Flag,
  Pencil,
  Trash2,
  GripVertical,
  Star,
} from "lucide-react";

import {
  TASK_STATUS,
  PROJECT_STATUS,
  PRIORITIES,
  getProjectProgress,
  type ProjectWithTasks,
  type ProjectTask,
  type TaskStatus,
} from "@/services/projects";

type Props = {
  project: ProjectWithTasks;
  busy: boolean;
  onBack: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onCreateTask: (status: TaskStatus) => void;
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
};

const COLUMNS: TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
];

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`)
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
}

export default function ProjectBoard({
  project,
  busy,
  onBack,
  onEdit,
  onFavorite,
  onDelete,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
}: Props) {
  const [draggingId, setDraggingId] =
    useState<string | null>(null);

  const [dragOver, setDragOver] =
    useState<TaskStatus | null>(null);

  const progress = getProjectProgress(
    project.project_tasks
  );

  return (
    <section className="project-board">
      <button
        className="project-back"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Todos os projetos
      </button>

      <header className="project-board-header">
        <div>
          <div className="project-board-title">
            <i style={{ background: project.color }} />

            <h2>{project.title}</h2>
          </div>

          <p>
            {project.description || "Sem descrição"}
          </p>
        </div>

        <div className="project-board-actions">
          <button
            disabled={busy}
            aria-label="Favoritar projeto"
            onClick={onFavorite}
          >
            <Star
              size={18}
              fill={project.favorite ? "#E97836" : "none"}
            />
          </button>

          <button
            disabled={busy}
            aria-label="Editar projeto"
            onClick={onEdit}
          >
            <Pencil size={17} />
          </button>

          <button
            disabled={busy}
            aria-label="Excluir projeto"
            onClick={onDelete}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <div className="project-board-meta">
        <span className="project-status">
          <i
            style={{
              background:
                PROJECT_STATUS[project.status].color,
            }}
          />

          {PROJECT_STATUS[project.status].label}
        </span>

        {project.due_date && (
          <span>
            <CalendarDays size={15} />
            {formatDate(project.due_date)}
          </span>
        )}
      </div>

      <div className="project-board-progress">
        <div>
          <span>Progresso do projeto</span>
          <strong>{progress.percentage}%</strong>
        </div>

        <div className="project-progress-track">
          <div
            style={{
              width: `${progress.percentage}%`,
              background: project.color,
            }}
          />
        </div>

        <small>
          {progress.completed} de {progress.total}
          {" "}tarefas concluídas
        </small>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((status) => {
          const tasks = project.project_tasks
            .filter((task) => task.status === status);

          return (
            <section
              key={status}
              className={`kanban-column ${dragOver === status ? "drag-over" : ""
                }`}
              onDragOver={(e) => {
                if (busy || !draggingId) return;

                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOver(status);
              }}
              onDragLeave={(e) => {
                if (
                  !e.currentTarget.contains(
                    e.relatedTarget as Node | null
                  )
                ) {
                  setDragOver(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();

                const id = draggingId;

                setDraggingId(null);
                setDragOver(null);

                if (id && !busy) {
                  onMoveTask(id, status);
                }
              }}
            >
              <header className="kanban-column-header">
                <i
                  style={{
                    background: TASK_STATUS[status].color,
                  }}
                />

                <strong>
                  {TASK_STATUS[status].label}
                </strong>

                <span>{tasks.length}</span>

                <button
                  disabled={busy}
                  aria-label="Adicionar tarefa"
                  onClick={() => onCreateTask(status)}
                >
                  <Plus size={17} />
                </button>
              </header>

              <div className="kanban-task-list">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    draggable={!busy}
                    className={`kanban-task ${draggingId === task.id
                        ? "dragging"
                        : ""
                      }`}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "text/plain",
                        task.id
                      );

                      e.dataTransfer.effectAllowed = "move";

                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                  >
                    <div className="kanban-task-top">
                      <GripVertical size={15} />

                      <button
                        className="kanban-task-title"
                        onClick={() => onEditTask(task)}
                      >
                        {task.title}
                      </button>

                      <button
                        disabled={busy}
                        aria-label="Excluir tarefa"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {task.description && (
                      <p>{task.description}</p>
                    )}

                    <div className="kanban-task-meta">
                      <span
                        style={{
                          color: PRIORITIES[task.priority].color,
                        }}
                      >
                        <Flag size={13} />
                        {PRIORITIES[task.priority].label}
                      </span>

                      {task.due_date && (
                        <span>
                          <CalendarDays size={13} />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>

                    <select
                      aria-label="Alterar status da tarefa"
                      disabled={busy}
                      value={task.status}
                      onChange={(e) =>
                        onMoveTask(
                          task.id,
                          e.target.value as TaskStatus
                        )
                      }
                    >
                      {COLUMNS.map((column) => (
                        <option key={column} value={column}>
                          {TASK_STATUS[column].label}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}

                <button
                  className="kanban-add-task"
                  disabled={busy}
                  onClick={() => onCreateTask(status)}
                >
                  <Plus size={15} />
                  Nova tarefa
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
