
"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";

import {
  EVENT_CATEGORIES,
  type CalendarEvent,
  type EventCategory,
  type EventFields,
} from "@/services/calendar";

type Props = {
  event?: CalendarEvent;
  initialStart: string;
  initialEnd?: string;
  initialAllDay?: boolean;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (fields: EventFields) => void;
  onDelete: () => void;
};

function localInput(value: string) {
  const date = new Date(value);

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

export default function EventForm({
  event,
  initialStart,
  initialEnd,
  initialAllDay,
  busy,
  error,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(event?.title ?? "");

  const [description, setDescription] = useState(
    event?.description ?? ""
  );

  const [location, setLocation] = useState(
    event?.location ?? ""
  );

  const [category, setCategory] = useState<EventCategory>(
    event?.category ?? "Pessoal"
  );

  const [allDay, setAllDay] = useState(
    event?.all_day ?? initialAllDay ?? false
  );

  const [start, setStart] = useState(
    localInput(event?.start_at ?? initialStart)
  );

  const [end, setEnd] = useState(
    event
      ? event.end_at
        ? localInput(event.end_at)
        : ""
      : initialEnd
        ? localInput(initialEnd)
        : ""
  );

  const [validation, setValidation] = useState("");

  function submit() {
    if (!title.trim() || !start || busy) return;

    const startValue = allDay
      ? `${start.slice(0, 10)}T00:00`
      : start;

    const endValue = end
      ? allDay
        ? `${end.slice(0, 10)}T00:00`
        : end
      : null;

    const startDate = new Date(startValue);

    const endDate = endValue
      ? new Date(endValue)
      : null;

    if (endDate && endDate <= startDate) {
      setValidation(
        "O término deve ser posterior ao início."
      );

      return;
    }

    setValidation("");

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      color: EVENT_CATEGORIES[category],
      all_day: allDay,
      start_at: startDate.toISOString(),
      end_at: endDate?.toISOString() ?? null,
    });
  }

  return (
    <div
      className="project-modal-overlay"
      onClick={() => !busy && onClose()}
    >
      <form
        className="project-modal calendar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <header className="project-modal-header">
          <div>
            <h2 id="event-form-title">
              {event ? "Editar evento" : "Novo evento"}
            </h2>

            <p>Reserve um tempo para seus objetivos.</p>
          </div>

          <button
            type="button"
            disabled={busy}
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        {(validation || error) && (
          <p className="project-error" role="alert">
            {validation || error}
          </p>
        )}

        <label>
          Título

          <input
            required
            autoFocus
            maxLength={160}
            placeholder="Ex.: Reunião de projeto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Categoria

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as EventCategory)
            }
          >
            {Object.keys(EVENT_CATEGORIES).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="calendar-checkbox">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />

          Evento de dia inteiro
        </label>

        <div className="calendar-date-fields">
          <label>
            Início

            <input
              required
              type={allDay ? "date" : "datetime-local"}
              value={allDay ? start.slice(0, 10) : start}
              onChange={(e) =>
                setStart(
                  allDay
                    ? `${e.target.value}T00:00`
                    : e.target.value
                )
              }
            />
          </label>

          <label>
            {allDay ? "Término (dia exclusivo)" : "Término"}

            <input
              type={allDay ? "date" : "datetime-local"}
              value={allDay ? end.slice(0, 10) : end}
              onChange={(e) =>
                setEnd(
                  allDay && e.target.value
                    ? `${e.target.value}T00:00`
                    : e.target.value
                )
              }
            />
          </label>
        </div>

        {allDay && (
          <small className="calendar-hint">
            Para um evento de apenas um dia, deixe o
            término vazio ou selecione o dia seguinte.
          </small>
        )}

        <label>
          Local

          <input
            value={location}
            placeholder="Local ou endereço"
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <label>
          Descrição

          <textarea
            rows={3}
            value={description}
            placeholder="Detalhes do compromisso..."
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </label>

        <footer className="project-modal-footer">
          {event && (
            <button
              type="button"
              className="calendar-delete"
              disabled={busy}
              aria-label="Excluir evento"
              onClick={onDelete}
            >
              <Trash2 size={17} />
            </button>
          )}

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
            {busy ? "Salvando..." : "Salvar evento"}
          </button>
        </footer>
      </form>
    </div>
  );
}
