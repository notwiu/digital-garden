
"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Sprout, LayoutGrid, Library, Network, Lightbulb,
  FolderKanban, CalendarDays, Search, Plus, Bell,
  Settings, FileText, Globe, Video,
  Image as ImageIcon, Link2, ArrowUpRight,
  X, Check, Clock3, ArrowRight
} from "lucide-react";

type Reference = {
  id: number;
  title: string;
  source: string;
  category: string;
  type: "artigo" | "site" | "vídeo" | "arquivo";
  date: string;
  status: "Organizado" | "Pendente";
};

const initialReferences: Reference[] = [
  {
    id: 1,
    title: "O futuro dos agentes de inteligência artificial",
    source: "Anthropic · Pesquisa",
    category: "Inteligência artificial",
    type: "artigo",
    date: "Hoje, 09:32",
    status: "Organizado",
  },
  {
    id: 2,
    title: "Princípios de design para produtos digitais",
    source: "Awwwards · Inspiração",
    category: "Design e UX",
    type: "site",
    date: "Ontem, 18:45",
    status: "Organizado",
  },
  {
    id: 3,
    title: "Como funciona a memória humana",
    source: "YouTube · Documentário",
    category: "Ciência",
    type: "vídeo",
    date: "23 nov, 14:20",
    status: "Pendente",
  },
  {
    id: 4,
    title: "Anotações sobre arquitetura de software",
    source: "Documento pessoal",
    category: "Desenvolvimento",
    type: "arquivo",
    date: "22 nov, 11:10",
    status: "Organizado",
  },
];

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
  const [references, setReferences] = useState(initialReferences);
  const [search, setSearch] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [captureTitle, setCaptureTitle] = useState("");
  const [captureUrl, setCaptureUrl] = useState("");
  const [captureCategory, setCaptureCategory] = useState("");
  const [captureType, setCaptureType] = useState("artigo");
  const [noticeOpen, setNoticeOpen] = useState(false);

  const filteredReferences = useMemo(() => {
    const query = search.toLowerCase().trim();

    return references.filter((item) =>
      `${item.title} ${item.category} ${item.source}`
        .toLowerCase()
        .includes(query)
    );
  }, [references, search]);

  const pendingCount = references.filter(
    (item) => item.status === "Pendente"
  ).length;

  const organizedCount = references.length - pendingCount;

  function handleCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!captureTitle.trim()) return;

    const item: Reference = {
      id: Date.now(),
      title: captureTitle.trim(),
      source: captureUrl.trim() || "Adicionado manualmente",
      category: captureCategory.trim() || "Sem categoria",
      type: captureType as Reference["type"],
      date: "Agora",
      status: "Pendente",
    };

    setReferences((current) => [item, ...current]);
    setCaptureTitle("");
    setCaptureUrl("");
    setCaptureCategory("");
    setCaptureType("artigo");
    setShowCapture(false);
  }

  function organizeReference(id: number) {
    setReferences((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "Organizado" } : item
      )
    );
  }

  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = references.find(item => item.id === selectedId);
  const topics = Array.from(new Set(references.map(item => item.category))).map(name => ({ name, count: references.filter(item => item.category === name).length }));
  const isOverview = activePage === "Visão geral";
  const isLibrary = activePage === "Biblioteca";
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
  function navigate(page: string) { setActivePage(page); setSearch(""); setSelectedId(null); }

  return (
    <main className="garden-shell">
      <aside className="garden-sidebar">
        <button className="garden-brand" onClick={() => navigate("Visão geral")}><span className="brand-symbol"><Sprout size={22} /></span><span>garden<span className="accent">.</span></span></button>
        <div className="workspace"><span className="workspace-avatar">W</span><div><strong>Meu jardim</strong><small>Espaço pessoal</small></div></div>
        <nav className="garden-nav">
          {navigation.map(section => <div className="nav-group" key={section.title}><span className="nav-label">{section.title === "ESPAÇO PESSOAL" ? "Biblioteca pessoal" : "Organização"}</span>{section.items.map(({ label, icon: Icon }) => <button key={label} className={`garden-nav-item ${activePage === label ? "selected" : ""}`} onClick={() => navigate(label)} aria-current={activePage === label ? "page" : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Biblioteca" && <small>{references.length}</small>}</button>)}</div>)}
        </nav>
        <div className="sidebar-lower"><button className="garden-nav-item" onClick={() => navigate("Configurações")}><Settings size={18} /><span>Configurações</span></button><div className="sidebar-profile"><span className="profile-avatar">W</span><div><strong>Willian</strong><small>Conta pessoal</small></div></div></div>
      </aside>
      <section className="garden-main">
        <header className="garden-topbar"><strong>{activePage}</strong><div className="topbar-tools"><label className="garden-search"><Search size={16} /><input ref={searchRef} aria-label="Buscar referências" placeholder="Buscar" value={search} onChange={e => { setSearch(e.target.value); if (!isOverview && !isLibrary) setActivePage("Biblioteca"); }} /><kbd>Ctrl K</kbd></label><div className="notice-container"><button className="icon-action" aria-label="Notificações" onClick={() => setNoticeOpen(v => !v)}><Bell size={19} />{pendingCount > 0 && <i />}</button>{noticeOpen && <div className="notice-popover"><strong>Notificações</strong><p>{pendingCount ? `${pendingCount} referência(s) para organizar.` : "Nenhuma pendência."}</p><button onClick={() => { navigate("Visão geral"); setNoticeOpen(false); }}>Ver visão geral</button></div>}</div><button className="top-capture" onClick={() => setShowCapture(true)}><Plus size={17} /><span>Nova referência</span></button></div></header>
        <div className="garden-content">
          <section className="page-intro"><div><p className="intro-date">{date}</p><h1>{isOverview ? "Meu jardim" : activePage}</h1><p>{isOverview ? "Suas referências, temas e descobertas." : isLibrary ? "Todas as suas referências em um só lugar." : "Esta área ainda está em desenvolvimento."}</p></div></section>
          {(isOverview || isLibrary) ? <>
            {isOverview && <section className="garden-summary">{[{ label: "Referências", value: references.length }, { label: "Temas", value: topics.length }, { label: "Organizadas", value: organizedCount }, { label: "Para revisar", value: pendingCount }].map(stat => <div className="summary-stat" key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong></div>)}</section>}
            <div className={`content-columns ${isLibrary ? "library-view" : ""}`}><section className="content-primary"><div className="section-heading"><h2>{search ? "Resultados da busca" : isLibrary ? "Todas as referências" : "Recentes"}</h2>{isOverview && <button className="text-link" onClick={() => navigate("Biblioteca")}>Ver todas <ArrowRight size={14} /></button>}</div><div className="list-header"><span>Nome</span><span>Estado</span></div><div className="reference-list">{(isLibrary || search ? filteredReferences : filteredReferences.slice(0, 5)).map(item => { const Icon = iconByType[item.type]; return <button className={`reference-card ${selectedId === item.id ? "active-reference" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><span className="reference-symbol"><Icon size={21} strokeWidth={1.6} /></span><span className="reference-main"><strong>{item.title}</strong><small>{item.category} · {item.source}</small></span><span className={`reference-status ${item.status === "Pendente" ? "waiting" : ""}`}><i />{item.status}</span><ArrowUpRight size={15} className="row-arrow" /></button>; })}{!filteredReferences.length && <div className="empty-references">Nenhuma referência encontrada.</div>}</div><button className="add-inline" onClick={() => setShowCapture(true)}><Plus size={16} /> Adicionar referência</button></section>
              {isOverview && <aside className="content-aside"><section className="aside-section"><h2>Temas</h2>{topics.map(topic => <button className="topic-entry" key={topic.name} onClick={() => { setActivePage("Biblioteca"); setSearch(topic.name); }}><span className="topic-color" /><span>{topic.name}</span><small>{topic.count}</small></button>)}</section><section className="aside-section"><h2>Para revisar <small>{pendingCount}</small></h2>{references.filter(item => item.status === "Pendente").map(item => <div className="pending-entry" key={item.id}><Clock3 size={17} /><span>{item.title}</span><button aria-label="Marcar como organizada" title="Marcar como organizada" onClick={() => organizeReference(item.id)}><Check size={17} /></button></div>)}{!pendingCount && <p className="muted">Tudo em dia.</p>}</section></aside>}
            </div></> : <button className="text-link" onClick={() => navigate("Visão geral")}>Voltar à visão geral</button>}
        </div>
      </section>
      {selected && <div className="capture-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}><section className="capture-dialog" role="dialog" aria-modal="true" aria-label="Detalhes da referência"><div className="dialog-top"><span className="dialog-icon"><FileText size={22} /></span><button className="dialog-close" aria-label="Fechar" onClick={() => setSelectedId(null)}><X size={18} /></button></div><h2>{selected.title}</h2><p>{selected.category} · {selected.date}</p><p>{selected.source}</p>{/^https?:\/\//i.test(selected.source) && <a className="text-link" href={selected.source} target="_blank" rel="noreferrer">Abrir origem <ArrowUpRight size={15} /></a>}{selected.status === "Pendente" && <button className="dialog-submit" onClick={() => organizeReference(selected.id)}>Marcar como organizada</button>}</section></div>}
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
            <h2>Adicionar referência</h2>
            <p>Preencha os detalhes abaixo.</p>

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

            <button type="submit" className="dialog-submit">
              <Plus size={17} /> Salvar referência
            </button>

          </form>
        </div>
      )}
    </main>
  );
}
