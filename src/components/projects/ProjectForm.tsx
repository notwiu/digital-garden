
"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

import {
  PROJECT_STATUS,
  type Project,
  type ProjectStatus,
} from "@/services/projects";

export type ProjectFormData = {
  title: string;
  description: string;
  color: string;
  status: ProjectStatus;
  due_date: string | null;
};

type Props = {
  project?: Project;
  busy: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
};

const COLORS = [
  "#E97836",
  "#477B61",
  "#647EAE",
  "#8B78B4",
  "#C95D67",
  "#B99A57",
  "#737378",
];

export default function ProjectForm({
  project,
  busy,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(
    project?.title ?? ""
  );

  const [description, setDescription] = useState(
    project?.description ?? ""
  );

  const [color, setColor] = useState(
    project?.color ?? COLORS[0]
  );

  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "planejamento"
  );

  const [dueDate, setDueDate] = useState(
    project?.due_date ?? ""
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
        aria-labelledby="project-form-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();

          if (!title.trim() || busy) return;

          onSubmit({
            title: title.trim(),
            description: description.trim(),
            color,
            status,
            due_date: dueDate || null,
          });
        }}
      >
        <header className="project-modal-header">
          <div>
            <h2 id="project-form-title">
              {project ? "Editar projeto" : "Novo projeto"}
            </h2>

            <p>
              Dê forma ao seu próximo objetivo.
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
          Nome do projeto

          <input
            autoFocus
            required
            maxLength={120}
            value={title}
            placeholder="Ex.: Aplicativo de estudos"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Descrição

          <textarea
            rows={4}
            value={description}
            placeholder="Qual é o objetivo deste projeto?"
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </label>

        <label>
          Status

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as ProjectStatus)
            }
          >
            {Object.entries(PROJECT_STATUS).map(
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

        <div className="project-color-field">
          <span>Cor do projeto</span>

          <div className="project-color-options">
            {COLORS.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`Cor ${item}`}
                aria-pressed={color === item}
                style={{ background: item }}
                onClick={() => setColor(item)}
              >
                {color === item && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

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
            {busy
              ? "Salvando..."
              : project
                ? "Salvar alterações"
                : "Criar projeto"}
          </button>
        </footer>
      </form>
    </div>
  );
}
