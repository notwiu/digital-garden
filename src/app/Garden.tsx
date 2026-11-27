
"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Sprout, LayoutGrid, Library, Network, Lightbulb,
  FolderKanban, CalendarDays, Search, Plus, Bell,
  Settings, FileText, Globe, Video,
  Image as ImageIcon, Link2, ArrowUpRight,
  X, Check, Clock3, ArrowRight, List, Grid2X2, Pencil, Trash2, Star
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

import { listReferences, saveReference, patchReference, deleteReference, importLegacy, type Reference } from "@/services/references";
import FileDropzone from "@/components/FileDropzone";
import FilePreview from "@/components/FilePreview";

import {
  uploadFile,
  deleteFile,
  formatFileSize,
} from "@/services/storage";
import KnowledgeMap from "@/components/knowledge/KnowledgeMap";
import IdeasLab from "@/components/ideas/IdeasLab";
import ProjectsLab from "@/components/projects/ProjectsLab";
import CalendarLab from "@/components/calendar/CalendarLab";

const navigation = [
  {
    title: "ESPAÇO PESSOAL",
    items: [
      { label: "Visão geral", icon: LayoutGrid },
      { label: "Biblioteca", icon: Library },
      { label: "Mapa de conhecimento", icon: Network },
      { label: "Laboratório de ideias", icon: Lightbulb },
    ],
  },
  {
    title: "SEU TRABALHO",
    items: [
      { label: "Projetos", icon: FolderKanban },
      { label: "Agenda", icon: CalendarDays },
    ],
  },
];

const iconByType = {
  artigo: FileText,
  site: Globe,
  vídeo: Video,
  arquivo: ImageIcon,
};

export default function Home() {
  const [activePage, setActivePage] = useState("Visão geral");
  const [references, setReferences] = useState<Reference[]>([]);
  const [search, setSearch] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [captureTitle, setCaptureTitle] = useState("");
  const [captureUrl, setCaptureUrl] = useState("");
  const [captureCategory, setCaptureCategory] = useState("");
  const [captureType, setCaptureType] = useState("artigo");
  const [noticeOpen, setNoticeOpen] = useState(false);

  const [typeFilter, setTypeFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [captureNotes, setCaptureNotes] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [legacy, setLegacy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const lock = useRef(false);
  const [captureFile, setCaptureFile] =
    useState<File | null>(null);
  const [previewFile, setPreviewFile] =
    useState<Reference | null>(null);
  const [requestedIdeaId, setRequestedIdeaId] =
    useState<string | null>(null);

  function report(error: unknown) {
    setStorageError(error && typeof error === "object" && "message" in error
      ? String(error.message) : "Não foi possível acessar o banco.");
  }

  useEffect(() => {
    let active = true;
    listReferences().then(rows => {
      if (active) { setReferences(rows); setStorageReady(true); }
    }).catch(error => { if (active) report(error); });
    try { setLegacy(!!localStorage.getItem("garden.references.v1")); } catch { }
    return () => { active = false; };
  }, []);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setStorageError("");
    setFeedback("");
    try { await action(); } catch (error) { report(error); }
    finally { lock.current = false; setBusy(false); }
  }

  async function migrate() {
    if (!window.confirm("Importar os dados antigos deste navegador para a conta atual? Confirme que pertencem a você.")) return;
    await run(async () => {
      const raw = localStorage.getItem("garden.references.v1");
      if (!raw) return;
      const count = await importLegacy(raw);
      setReferences(await listReferences());
      setStorageReady(true);
      setLegacy(false);
      setFeedback(`${count} referência(s) elegíveis verificadas. Registros já importados não foram duplicados.`);
    });
  }

  const filteredReferences = useMemo(() => {
    const query = search.toLowerCase().trim();

    const result = references.filter((item) =>
      `${item.title} ${item.category} ${item.source}`
        .toLowerCase()
        .includes(query)
    );
    if (activePage !== "Biblioteca") return result;
    const filtered = result.filter(item =>
      (typeFilter === "Todos" || item.type === typeFilter) &&
      (categoryFilter === "Todos" || item.category === categoryFilter) &&
      (statusFilter === "Todos" || item.status === statusFilter) &&
      (!favoritesOnly || item.favorite));
    return sort === "name" ? filtered.sort((a, b) => a.title.localeCompare(b.title, "pt-BR")) : sort === "old" ? [...filtered].reverse() : filtered;
  }, [references, search, activePage, typeFilter, categoryFilter, statusFilter, favoritesOnly, sort]);

  const pendingCount = references.filter(
    (item) => item.status === "Pendente"
  ).length;

  const organizedCount = references.length - pendingCount;


  async function handleCapture(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!captureTitle.trim() || !storageReady) return;

    await run(async () => {
      const existing = references.find(
        (r) => r.id === editingId
      );

      if (
        captureType === "arquivo" &&
        !captureFile &&
        !existing?.file_path
      ) {
        throw new Error("Selecione um arquivo.");
      }

      let attachment = {
        file_path: existing?.file_path ?? null,
        file_name: existing?.file_name ?? null,
        file_size: existing?.file_size ?? null,
        mime_type: existing?.mime_type ?? null,
      };

      if (captureType !== "arquivo") {
        attachment = {
          file_path: null,
          file_name: null,
          file_size: null,
          mime_type: null,
        };
      }

      if (captureType === "arquivo" && captureFile) {
        attachment = await uploadFile(captureFile);
      }

      const item = await saveReference(
        {
          title: captureTitle.trim(),

          source:
            captureType === "arquivo"
              ? attachment.file_name || "Arquivo pessoal"
              : captureUrl.trim() || "Adicionado manualmente",

          category:
            captureCategory.trim() || "Sem categoria",

          type: captureType as Reference["type"],
          notes: captureNotes.trim(),
          favorite: existing?.favorite ?? false,
          status: existing?.status ?? "Pendente",

          ...attachment,
        },
        editingId
      );

      setReferences((current) =>
        editingId === null
          ? [item, ...current]
          : current.map((r) =>
            r.id === editingId ? item : r
          )
      );

      setEditingId(null);
      setCaptureNotes("");
      setCaptureTitle("");
      setCaptureUrl("");
      setCaptureCategory("");
      setCaptureType("artigo");
      setCaptureFile(null);
      setShowCapture(false);

      // Remove o anexo anterior somente depois
      // que a referência foi atualizada.
      if (
        existing?.file_path &&
        existing.file_path !== attachment.file_path
      ) {
        try {
          await deleteFile(existing.file_path);
        } catch {
          setFeedback(
            "Referência salva, mas não foi possível remover o arquivo anterior."
          );
        }
      }
    });
  }

  async function organizeReference(id: string) {
    await run(async () => {
      const item = await patchReference(id, { status: "Organizado" });
      setReferences(current => current.map(r => r.id === id ? item : r));
    });
  }

  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = references.find(item => item.id === selectedId);
  const topics = Array.from(new Set(references.map(item => item.category))).map(name => ({ name, count: references.filter(item => item.category === name).length }));
  const isOverview = activePage === "Visão geral";
  const isKnowledgeMap =
    activePage === "Mapa de conhecimento";
  const isProjects = activePage === "Projetos";
  const isIdeasLab =
    activePage === "Laboratório de ideias";
  const isLibrary = activePage === "Biblioteca";
  const isCalendar = activePage === "Agenda";
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()));
    function shortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setShowCapture(false); setSelectedId(null); setNoticeOpen(false); }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  function openCapture() {
    setEditingId(null);
    setCaptureTitle("");
    setCaptureUrl("");
    setCaptureCategory("");
    setCaptureType("artigo");
    setCaptureNotes("");
    setCaptureFile(null);
    setStorageError("");
    setShowCapture(true);
  }


  function editReference(item: Reference) {
    setEditingId(item.id);
    setCaptureTitle(item.title);
    setCaptureUrl(item.source);
    setCaptureCategory(item.category);
    setCaptureType(item.type);
    setCaptureNotes(item.notes ?? "");
    setCaptureFile(null);
    setStorageError("");
    setSelectedId(null);
    setShowCapture(true);
  }

  async function toggleFavorite(id: string) {
    await run(async () => {
      const item = await patchReference(id, { favorite: !references.find(r => r.id === id)?.favorite });
      setReferences(current => current.map(r => r.id === id ? item : r));
    });
  }

  async function removeReference(id: string) {
    if (!window.confirm("Excluir esta referência?")) {
      return;
    }

    await run(async () => {
      const reference = references.find(
        (item) => item.id === id
      );

      await deleteReference(id);

      setReferences((current) =>
        current.filter((r) => r.id !== id)
      );

      setSelectedId(null);

      if (reference?.file_path) {
        try {
          await deleteFile(reference.file_path);
        } catch {
          setFeedback(
            "Referência excluída, mas não foi possível remover o arquivo do armazenamento."
          );
        }
      }
    });
  }

  function resetFilters() { setTypeFilter("Todos"); setCategoryFilter("Todos"); setStatusFilter("Todos"); setFavoritesOnly(false); setSearch(""); }
  function navigate(page: string) { setActivePage(page); resetFilters(); setSelectedId(null); setRequestedIdeaId(null); }

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const ideaId = params.get("idea");
    const referenceId = params.get("reference");

    if (ideaId) {
      navigate("Laboratório de ideias");
      setRequestedIdeaId(ideaId);
    } else if (referenceId) {
      navigate("Biblioteca");
      setSelectedId(referenceId);
    }

    if (ideaId || referenceId) {
      window.history.replaceState(
        window.history.state,
        "",
        "/"
      );
    }
  }, []);


  return (
    <main className="garden-shell">
      <aside className="garden-sidebar">
        <button className="garden-brand" onClick={() => navigate("Visão geral")}><span className="brand-symbol"><Sprout size={22} /></span><span>garden<span className="accent">.</span></span></button>
        <div className="workspace"><span className="workspace-avatar">W</span><div><strong>Meu jardim</strong><small>Espaço pessoal</small></div></div>
        <nav className="garden-nav">
          {navigation.map(section => <div className="nav-group" key={section.title}><span className="nav-label">{section.title === "ESPAÇO PESSOAL" ? "Biblioteca pessoal" : "Organização"}</span>{section.items.map(({ label, icon: Icon }) => <button key={label} className={`garden-nav-item ${activePage === label ? "selected" : ""}`} onClick={() => navigate(label)} aria-current={activePage === label ? "page" : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Biblioteca" && <small>{references.length}</small>}</button>)}</div>)}
        </nav>
        <div className="sidebar-lower"><button className="garden-nav-item" onClick={() => navigate("Configurações")}><Settings size={18} /><span>Configurações</span></button><div className="sidebar-profile"><span className="profile-avatar">W</span><div><strong>Willian</strong><small>Conta pessoal</small></div></div></div>
        <LogoutButton />
      </aside>
      <section className="garden-main">
        <header className="garden-topbar"><strong>{activePage}</strong><div className="topbar-tools"><label className="garden-search"><Search size={16} /><input ref={searchRef} aria-label="Buscar referências" placeholder="Buscar" value={search} onChange={e => { setSearch(e.target.value); if (!isOverview && !isLibrary) setActivePage("Biblioteca"); }} /><kbd>Ctrl K</kbd></label><div className="notice-container"><button className="icon-action" aria-label="Notificações" onClick={() => setNoticeOpen(v => !v)}><Bell size={19} />{pendingCount > 0 && <i />}</button>{noticeOpen && <div className="notice-popover"><strong>Notificações</strong><p>{pendingCount ? `${pendingCount} referência(s) para organizar.` : "Nenhuma pendência."}</p><button onClick={() => { navigate("Visão geral"); setNoticeOpen(false); }}>Ver visão geral</button></div>}</div><button className="top-capture" disabled={busy || !storageReady} onClick={openCapture}><Plus size={17} /><span>Nova referência</span></button></div></header>
        <div className="garden-content">
          <section className="page-intro"><div><p className="intro-date">{date}</p><h1>{isOverview ? "Meu jardim" : activePage}</h1>

            <p>
              {isOverview
                ? "Suas referências, temas e descobertas."
                : isLibrary
                  ? "Todas as suas referências em um só lugar."
                  : isKnowledgeMap
                    ? "Explore as conexões do seu conhecimento."
                    : isIdeasLab
                      ? "Onde seu conhecimento ganha forma."
                      : isProjects
                        ? "Transforme suas ideias em realidade."
                        : isCalendar
                          ? "Organize seu tempo e seus compromissos."
                          : "Esta área ainda está em desenvolvimento."
              }
            </p>

          </div></section>
          {storageError && <p role="alert" className="storage-warning">{storageError}</p>}
          {!storageReady && <p role="status">{storageError ? "Não foi possível carregar." : "Carregando referências..."}</p>}
          {feedback && <p role="status">{feedback}</p>}
          {legacy && storageReady && <button className="add-inline" disabled={busy} onClick={migrate}>Importar referências antigas deste navegador</button>}
          {isLibrary && <section className="library-tools" aria-label="Filtros da biblioteca">
            <div className="library-tabs">{["Todos", "artigo", "site", "vídeo", "arquivo"].map(t => <button key={t} className={typeFilter === t ? "chosen" : ""} onClick={() => setTypeFilter(t)}>{({ Todos: "Todas", artigo: "Artigos", site: "Sites", vídeo: "Vídeos", arquivo: "Arquivos" } as Record<string, string>)[t]}</button>)}</div>
            <div className="library-filters"><select aria-label="Tema" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="Todos">Todos os temas</option>{topics.map(t => <option key={t.name}>{t.name}</option>)}</select><select aria-label="Estado" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="Todos">Todos os estados</option><option>Organizado</option><option>Pendente</option></select><button className={favoritesOnly ? "chosen" : ""} onClick={() => setFavoritesOnly(v => !v)} aria-pressed={favoritesOnly}><Star size={15} /> Favoritos</button><select aria-label="Ordenação" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Mais recentes</option><option value="old">Mais antigas</option><option value="name">Nome A–Z</option></select><div className="view-switch"><button aria-label="Lista" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={17} /></button><button aria-label="Grade" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={16} /></button></div></div>
            <div className="library-count"><span>{filteredReferences.length} de {references.length} referências</span><button className="text-link" onClick={resetFilters}>Limpar filtros</button></div>
          </section>}
          {(isOverview || isLibrary) ? (
            <>
              {isOverview && <section className="garden-summary">{[{ label: "Referências", value: references.length }, { label: "Temas", value: topics.length }, { label: "Organizadas", value: organizedCount }, { label: "Para revisar", value: pendingCount }].map(stat => <div className="summary-stat" key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong></div>)}</section>}
              <div className={`content-columns ${isLibrary ? "library-view" : ""}`}><section className="content-primary"><div className="section-heading"><h2>{search ? "Resultados da busca" : isLibrary ? "Todas as referências" : "Recentes"}</h2>{isOverview && <button className="text-link" onClick={() => navigate("Biblioteca")}>Ver todas <ArrowRight size={14} /></button>}</div><div className={`list-header ${isLibrary && view === "grid" ? "hidden-header" : ""}`}><span>Nome</span><span>Estado</span></div><div className={`reference-list ${isLibrary && view === "grid" ? "reference-grid" : ""}`}>{(isLibrary || search ? filteredReferences : filteredReferences.slice(0, 5)).map(item => { const Icon = iconByType[item.type]; return <button className={`reference-card ${selectedId === item.id ? "active-reference" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><span className="reference-symbol"><Icon size={21} strokeWidth={1.6} /></span><span className="reference-main"><strong>{item.favorite && <Star size={12} className="favorite-mark" />}{item.title}</strong><small>{item.category} · {item.source}</small></span><span className={`reference-status ${item.status === "Pendente" ? "waiting" : ""}`}><i />{item.status}</span><ArrowUpRight size={15} className="row-arrow" /></button>; })}{!filteredReferences.length && <div className="empty-references">Nenhuma referência encontrada.</div>}</div><button className="add-inline" disabled={busy || !storageReady} onClick={openCapture}><Plus size={16} /> Adicionar referência</button></section>
                {isOverview && <aside className="content-aside"><section className="aside-section"><h2>Temas</h2>{topics.map(topic => <button className="topic-entry" key={topic.name} onClick={() => { navigate("Biblioteca"); setCategoryFilter(topic.name); }}><span className="topic-color" /><span>{topic.name}</span><small>{topic.count}</small></button>)}</section><section className="aside-section"><h2>Para revisar <small>{pendingCount}</small></h2>{references.filter(item => item.status === "Pendente").map(item => <div className="pending-entry" key={item.id}><Clock3 size={17} /><span>{item.title}</span><button aria-label="Marcar como organizada" title="Marcar como organizada" disabled={busy} onClick={() => organizeReference(item.id)}><Check size={17} /></button></div>)}{!pendingCount && <p className="muted">Tudo em dia.</p>}</section></aside>}

              </div>
            </>


          ) : isKnowledgeMap ? (
            <KnowledgeMap
              references={references}
              onOpenReference={(id) => {
                if (document.fullscreenElement) {
                  void document.exitFullscreen();
                }

                setSelectedId(id);
              }}
              onOpenIdea={(id) => {
                if (document.fullscreenElement) {
                  void document.exitFullscreen();
                }

                navigate("Laboratório de ideias");
                setRequestedIdeaId(id);
              }}
            />

          ) : isIdeasLab ? (
            <IdeasLab
              references={references}
              initialIdeaId={requestedIdeaId}
              onOpenReference={(id) => setSelectedId(id)}
            />
          ) : isProjects ? (
            <ProjectsLab />
          ) : isCalendar ? (
            <CalendarLab />
          ) : (
            <button
              className="text-link"
              onClick={() => navigate("Visão geral")}
            >
              Voltar à visão geral
            </button>
          )}




        </div>
      </section>
      {selected && <div className="capture-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}><section className="capture-dialog" role="dialog" aria-modal="true" aria-label="Detalhes da referência"><div className="dialog-top"><span className="dialog-icon"><FileText size={22} /></span><button className="dialog-close" aria-label="Fechar" onClick={() => setSelectedId(null)}><X size={18} /></button></div><h2>{selected.title}</h2><p>{selected.category} · {selected.date}</p><p>{selected.source}</p>
        {selected.file_path && (
          <button
            type="button"
            className="attachment-card"
            onClick={() => setPreviewFile(selected)}
          >
            <span className="attachment-icon">
              <FileText size={25} strokeWidth={1.5} />
            </span>

            <span className="attachment-info">
              <strong>{selected.file_name}</strong>

              <small>
                {formatFileSize(selected.file_size ?? 0)}
                {" · Visualizar arquivo"}
              </small>
            </span>

            <ArrowUpRight size={17} />
          </button>
        )}
        {storageError && <p role="alert" className="storage-warning">{storageError}</p>}{selected.notes && <p className="reference-notes">{selected.notes}</p>}<div className="detail-actions"><button disabled={busy} onClick={() => toggleFavorite(selected.id)}><Star size={16} fill={selected.favorite ? "currentColor" : "none"} />{selected.favorite ? "Favorito" : "Favoritar"}</button><button onClick={() => editReference(selected)}><Pencil size={15} /> Editar</button><button disabled={busy} onClick={() => removeReference(selected.id)}><Trash2 size={15} /> Excluir</button></div>{/^https?:\/\//i.test(selected.source) && <a className="text-link" href={selected.source} target="_blank" rel="noreferrer">Abrir origem <ArrowUpRight size={15} /></a>}{selected.status === "Pendente" && <button className="dialog-submit" disabled={busy} onClick={() => organizeReference(selected.id)}>Marcar como organizada</button>}</section></div>}
      {showCapture && (
        <div
          className="capture-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCapture(false);
          }}
        >
          <form className="capture-dialog" onSubmit={handleCapture}>
            <div className="dialog-top">
              <div className="dialog-icon"><Sprout size={21} /></div>
              <button
                type="button"
                className="dialog-close"
                onClick={() => setShowCapture(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <span className="dialog-overline">Nova referência</span>
            <h2>{editingId === null ? "Adicionar referência" : "Editar referência"}</h2>
            <p>Preencha os detalhes abaixo.</p>{storageError && <p role="alert" className="storage-warning">{storageError}</p>}

            <label htmlFor="capture-title">Título</label>
            <input
              id="capture-title"
              value={captureTitle}
              onChange={(event) => setCaptureTitle(event.target.value)}
              placeholder="O que despertou sua curiosidade?"
              required
              autoFocus
            />

            <label htmlFor="capture-url">Link ou origem <small>OPCIONAL</small></label>
            <div className="dialog-input-icon">
              <Link2 size={16} />
              <input
                id="capture-url"
                value={captureUrl}
                onChange={(event) => setCaptureUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="dialog-fields">
              <div>
                <label htmlFor="capture-type">Formato</label>
                <select
                  id="capture-type"
                  value={captureType}
                  onChange={(event) => setCaptureType(event.target.value)}
                >
                  <option value="artigo">Artigo</option>
                  <option value="site">Site</option>
                  <option value="vídeo">Vídeo</option>
                  <option value="arquivo">Arquivo</option>
                </select>
              </div>
              <div>
                <label htmlFor="capture-category">Tema</label>
                <input
                  id="capture-category"
                  value={captureCategory}
                  onChange={(event) => setCaptureCategory(event.target.value)}
                  placeholder="Ex.: Tecnologia"
                />
              </div>
            </div>

            {captureType === "arquivo" && (
              <>
                <label>Documento</label>

                {editingId && !captureFile && (
                  <p className="existing-attachment">
                    {references.find(
                      (r) => r.id === editingId
                    )?.file_name
                      ? `Arquivo atual: ${references.find(
                        (r) => r.id === editingId
                      )?.file_name
                      }`
                      : "Nenhum arquivo anexado."}
                  </p>
                )}

                <FileDropzone
                  file={captureFile}
                  disabled={busy}
                  onChange={(file) => {
                    setCaptureFile(file);

                    if (file && !captureTitle.trim()) {
                      setCaptureTitle(
                        file.name.replace(/\.[^.]+$/, "")
                      );
                    }
                  }}
                />
              </>
            )}

            <label htmlFor="capture-notes">Anotações</label><textarea id="capture-notes" rows={4} value={captureNotes} onChange={e => setCaptureNotes(e.target.value)} placeholder="Por que guardar esta referência?" />
            <button type="submit" disabled={busy || !storageReady} className="dialog-submit">
              <Plus size={17} /> {busy ? "Salvando..." : "Salvar referência"}
            </button>

          </form>
        </div>
      )}

      {previewFile?.file_path && (
        <FilePreview
          key={previewFile.file_path}
          path={previewFile.file_path}
          name={previewFile.file_name || "Documento"}
          size={previewFile.file_size ?? 0}
          mimeType={previewFile.mime_type || ""}
          onClose={() => setPreviewFile(null)}
        />
      )}

    </main>
  );
}
