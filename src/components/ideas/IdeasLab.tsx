
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Plus,
  Search,
  Star,
  Trash2,
  Lightbulb,
  Check,
  Link2,
  X,
  FileText,
} from "lucide-react";

import {
  listIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  listIdeaReferences,
  linkReference,
  unlinkReference,
  MATURITY,
  type Idea,
  type Maturity,
} from "@/services/ideas";

import type { Reference } from "@/services/references";

import IdeaEditor from "./IdeaEditor";

type Props = {
  references: Reference[];
  onOpenReference: (id: string) => void;
  initialIdeaId?: string | null;
};

type SaveStatus = "saved" | "pending" | "saving" | "error";

export default function IdeasLab({
  references,
  onOpenReference,
  initialIdeaId,
}: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [linkedIds, setLinkedIds] =
    useState<string[]>([]);

  const [linkChoice, setLinkChoice] = useState("");
  const [linksLoading, setLinksLoading] = useState(false);

  const [saveStatus, setSaveStatus] =
    useState<SaveStatus>("saved");

  const draftRef = useRef<Idea | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);

  const selected = ideas.find(
    (idea) => idea.id === selectedId
  );

  function report(err: unknown) {
    setError(
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "Não foi possível concluir a operação."
    );
  }

  useEffect(() => {
    let active = true;

    listIdeas()
      .then((rows) => {
        if (!active) return;

        setIdeas(rows);
        setSelectedId(
          rows.find((idea) => idea.id === initialIdeaId)?.id
          ?? rows[0]?.id
          ?? null
        );
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
  }, [initialIdeaId]);

  useEffect(() => {
    let active = true;

    setLinkedIds([]);
    setLinkChoice("");

    if (!selectedId) {
      setLinksLoading(false);
      return;
    }

    setLinksLoading(true);

    listIdeaReferences(selectedId)
      .then((ids) => {
        if (active) setLinkedIds(ids);
      })
      .catch((err) => {
        if (active) report(err);
      })
      .finally(() => {
        if (active) setLinksLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  async function flushSave(): Promise<boolean> {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (savingRef.current) return false;
    if (!dirtyRef.current || !draftRef.current) return true;

    const draft = draftRef.current;

    savingRef.current = true;
    dirtyRef.current = false;
    setSaveStatus("saving");

    try {
      const saved = await updateIdea(draft.id, {
        title: draft.title.trim() || "Sem título",
        content: draft.content,
        maturity: draft.maturity,
        favorite: draft.favorite,
      });

      if (!dirtyRef.current) {
        draftRef.current = null;

        setIdeas((current) =>
          current.map((idea) =>
            idea.id === saved.id ? saved : idea
          )
        );

        setSaveStatus("saved");
      } else {
        setSaveStatus("pending");
      }

      return !dirtyRef.current;
    } catch (err) {
      dirtyRef.current = true;
      setSaveStatus("error");
      report(err);
      return false;
    } finally {
      savingRef.current = false;

      if (dirtyRef.current && draftRef.current !== draft) {
        timerRef.current = setTimeout(() => {
          void flushSave();
        }, 900);
      }
    }
  }

  function changeIdea(fields: Partial<Idea>) {
    if (!selected) return;

    const current =
      draftRef.current?.id === selected.id
        ? draftRef.current
        : selected;

    const updated = {
      ...current,
      ...fields,
    };

    draftRef.current = updated;
    dirtyRef.current = true;

    setIdeas((items) =>
      items.map((idea) =>
        idea.id === updated.id ? updated : idea
      )
    );

    setSaveStatus("pending");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void flushSave();
    }, 900);
  }

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (dirtyRef.current || savingRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener(
      "beforeunload",
      warnBeforeLeave
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        warnBeforeLeave
      );

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      void flushSave();
    };
  }, []);

  async function selectIdea(id: string) {
    if (busy || id === selectedId) return;

    if (!(await flushSave())) {
      return;
    }

    setSelectedId(id);
    setSaveStatus("saved");
  }

  async function addIdea() {
    if (busy) return;
    if (!(await flushSave())) return;

    setBusy(true);
    setError("");

    try {
      const idea = await createIdea();

      setIdeas((current) => [idea, ...current]);
      setSelectedId(idea.id);
      setFilter("all");
      setSearch("");
      setSaveStatus("saved");
    } catch (err) {
      report(err);
    } finally {
      setBusy(false);
    }
  }

  async function removeIdea() {
    if (!selected || busy) return;

    if (!window.confirm("Excluir esta ideia?")) {
      return;
    }

    if (!(await flushSave())) return;

    setBusy(true);

    try {
      await deleteIdea(selected.id);

      const remaining = ideas.filter(
        (idea) => idea.id !== selected.id
      );

      setIdeas(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    } catch (err) {
      report(err);
    } finally {
      setBusy(false);
    }
  }

  async function addLink() {
    if (!selectedId || !linkChoice || busy) return;

    setBusy(true);

    try {
      await linkReference(selectedId, linkChoice);

      setLinkedIds((current) =>
        Array.from(new Set([...current, linkChoice]))
      );

      setLinkChoice("");
    } catch (err) {
      report(err);
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(referenceId: string) {
    if (!selectedId || busy) return;

    setBusy(true);

    try {
      await unlinkReference(selectedId, referenceId);

      setLinkedIds((current) =>
        current.filter((id) => id !== referenceId)
      );
    } catch (err) {
      report(err);
    } finally {
      setBusy(false);
    }
  }

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = idea.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "favorites" && idea.favorite) ||
      idea.maturity === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <section className="ideas-lab">
      <aside className="ideas-sidebar">
        <div className="ideas-sidebar-top">
          <div className="ideas-sidebar-heading">
            <strong>Minhas ideias</strong>

            <button
              title="Nova ideia"
              aria-label="Nova ideia"
              disabled={busy || loading}
              onClick={addIdea}
            >
              <Plus size={19} />
            </button>
          </div>

          <div className="ideas-search">
            <Search size={15} />

            <input
              placeholder="Buscar ideias"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="ideas-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas as ideias</option>
            <option value="favorites">Favoritas</option>

            {Object.entries(MATURITY).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ideas-list">
          {loading && <p>Carregando ideias...</p>}

          {filteredIdeas.map((idea) => (
            <button
              key={idea.id}
              disabled={busy}
              onClick={() => selectIdea(idea.id)}
              className={`idea-list-item ${idea.id === selectedId ? "selected" : ""
                }`}
            >
              <strong>
                {idea.favorite && <Star size={12} />}
                {idea.title || "Sem título"}
              </strong>

              <span>
                <i
                  style={{
                    background: MATURITY[idea.maturity].color,
                  }}
                />

                {MATURITY[idea.maturity].label}
              </span>

              <small>
                {new Date(idea.updated_at)
                  .toLocaleDateString("pt-BR")}
              </small>
            </button>
          ))}

          {!loading && !filteredIdeas.length && (
            <p className="ideas-list-empty">
              Nenhuma ideia encontrada.
            </p>
          )}
        </div>

        <footer className="ideas-sidebar-footer">
          {ideas.length} ideias
        </footer>
      </aside>

      <div className="ideas-main">
        {error && (
          <p className="storage-warning" role="alert">
            {error}
          </p>
        )}

        {selected ? (
          <>
            <header className="idea-document-header">
              <span>
                {new Date(selected.created_at)
                  .toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
              </span>

              <div>
                <button
                  aria-label="Favoritar ideia"
                  disabled={busy}
                  onClick={() =>
                    changeIdea({
                      favorite: !selected.favorite,
                    })
                  }
                >
                  <Star
                    size={19}
                    fill={
                      selected.favorite
                        ? "#E97836"
                        : "none"
                    }
                  />
                </button>

                <button
                  aria-label="Excluir ideia"
                  disabled={busy}
                  onClick={removeIdea}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </header>

            <input
              className="idea-title-input"
              aria-label="Título da ideia"
              value={selected.title}
              disabled={busy}
              placeholder="Sem título"
              onChange={(e) =>
                changeIdea({ title: e.target.value })
              }
            />

            <div className="idea-maturity">
              <i
                style={{
                  background: MATURITY[selected.maturity].color,
                }}
              />

              <select
                aria-label="Maturidade da ideia"
                value={selected.maturity}
                disabled={busy}
                onChange={(e) =>
                  changeIdea({
                    maturity: e.target.value as Maturity,
                  })
                }
              >
                {Object.entries(MATURITY).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <IdeaEditor
              key={selected.id}
              content={selected.content}
              onChange={(content) =>
                changeIdea({ content })
              }
            />

            <section className="idea-linked-references">
              <h3>
                <Link2 size={16} />
                Referências vinculadas
              </h3>

              {linksLoading && <p>Carregando vínculos...</p>}

              {references
                .filter((r) => linkedIds.includes(r.id))
                .map((reference) => (
                  <div
                    key={reference.id}
                    className="idea-reference-item"
                  >
                    <button
                      onClick={() =>
                        onOpenReference(reference.id)
                      }
                    >
                      <FileText size={17} />
                      <span>{reference.title}</span>
                    </button>

                    <button
                      disabled={busy}
                      aria-label="Desvincular referência"
                      onClick={() =>
                        removeLink(reference.id)
                      }
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

              <div className="idea-link-picker">
                <select
                  value={linkChoice}
                  disabled={busy || linksLoading}
                  onChange={(e) =>
                    setLinkChoice(e.target.value)
                  }
                >
                  <option value="">
                    Selecionar referência
                  </option>

                  {references
                    .filter((r) => !linkedIds.includes(r.id))
                    .map((reference) => (
                      <option
                        key={reference.id}
                        value={reference.id}
                      >
                        {reference.title}
                      </option>
                    ))}
                </select>

                <button
                  disabled={!linkChoice || busy || linksLoading}
                  onClick={addLink}
                >
                  <Plus size={16} />
                  Vincular
                </button>
              </div>
            </section>

            <footer className="idea-save-status">
              {saveStatus === "saved" && (
                <>
                  <Check size={14} />
                  Alterações salvas
                </>
              )}

              {saveStatus === "pending" &&
                "Alterações pendentes..."}

              {saveStatus === "saving" &&
                "Salvando..."}

              {saveStatus === "error" && (
                <button onClick={() => flushSave()}>
                  Falha ao salvar. Tentar novamente.
                </button>
              )}
            </footer>
          </>
        ) : (
          <div className="ideas-empty">
            <Lightbulb size={42} strokeWidth={1.3} />

            <h2>Grandes ideias começam pequenas.</h2>

            <p>
              Registre seus pensamentos, explore
              possibilidades e cultive seu conhecimento.
            </p>

            <button
              disabled={busy || loading}
              onClick={addIdea}
            >
              <Plus size={17} />
              Criar ideia
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
