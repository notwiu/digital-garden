
"use client";

import { useState } from "react";
import { X } from "lucide-react";

import {
  PRIORITIES,
  TASK_STATUS,
  type ProjectTask,
  type Priority,
  type TaskStatus,
} from "@/services/projects";

export type TaskFormData = {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
};

type Props = {
  task?: ProjectTask;
  initialStatus?: TaskStatus;
  busy: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
};

export default function TaskForm({
  task,
  initialStatus = "todo",
  busy,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(task?.title ?? "");

  const [description, setDescription] = useState(
    task?.description ?? ""
  );

  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "medium"
  );

  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? initialStatus
  );

  const [dueDate, setDueDate] = useState(
    task?.due_date ?? ""
  );

  return (
    <div
      className="project-modal-overlay"
      onClick={() => !busy && onClose()}
    >
      <form
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();

          if (!title.trim() || busy) return;

          onSubmit({
            title: title.trim(),
            description: description.trim(),
            priority,
            status,
            due_date: dueDate || null,
          });
        }}
      >
        <header className="project-modal-header">
          <div>
            <h2 id="task-form-title">
              {task ? "Editar tarefa" : "Nova tarefa"}
            </h2>

            <p>
              Pequenas ações, grandes resultados.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={busy}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <label>
          Título

          <input
            autoFocus
            required
            maxLength={160}
            value={title}
            placeholder="O que precisa ser feito?"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Descrição

          <textarea
            rows={4}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </label>

        <label>
          Prioridade

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as Priority)
            }
          >
            {Object.entries(PRIORITIES).map(
              ([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          Status

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as TaskStatus)
            }
          >
            {Object.entries(TASK_STATUS).map(
              ([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          Prazo

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>

        <footer className="project-modal-footer">
          <button
            type="button"
            className="project-secondary-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="project-primary-button"
            disabled={busy || !title.trim()}
          >
            {busy ? "Salvando..." : "Salvar tarefa"}
          </button>
        </footer>
      </form>
    </div>
  );
}
