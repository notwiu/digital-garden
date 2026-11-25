
"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Sprout, LayoutGrid, Library, Network, Lightbulb,
  FolderKanban, CalendarDays, Search, Plus, Bell,
  Settings, MoreHorizontal, FileText, Globe, Video,
  Image as ImageIcon, Link2, ArrowUpRight, ChevronDown,
  X, Check, Clock3, Command, Leaf, ArrowRight,
  Bookmark, SlidersHorizontal, Sparkles
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

const topics = [
  { name: "Inteligência artificial", count: 18, color: "#668B73" },
  { name: "Desenvolvimento", count: 14, color: "#718DAF" },
  { name: "Design e UX", count: 9, color: "#C18B61" },
  { name: "Ciência", count: 7, color: "#9585AD" },
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

  return (
    <main className="garden-shell">
      <aside className="garden-sidebar">
        <a className="garden-brand" href="#">
          <span className="brand-symbol"><Sprout size={20} strokeWidth={1.8} /></span>
          <span className="brand-word">garden<span>.</span></span>
        </a>

        <button className="workspace-switch">
          <span className="workspace-avatar">W</span>
          <span className="workspace-info">
            <strong>Meu jardim</strong>
            <small>Espaço pessoal</small>
          </span>
          <ChevronDown size={15} />
        </button>

        <button
          className="capture-button"
          onClick={() => setShowCapture(true)}
        >
          <Plus size={17} />
          <span>Nova referência</span>
          <kbd>N</kbd>
        </button>

        <nav className="garden-nav">
          {navigation.map((section) => (
            <div className="nav-group" key={section.title}>
              <span className="nav-label">{section.title}</span>

              {section.items.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className={`garden-nav-item ${activePage === label ? "selected" : ""}`}
                  onClick={() => setActivePage(label)}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                  {label === "Biblioteca" && (
                    <small>{String(references.length).padStart(2, "0")}</small>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-lower">
          <div className="sidebar-note">
            <div className="sidebar-note-icon"><Leaf size={17} /></div>
            <span className="sidebar-note-kicker">UMA IDEIA PARA HOJE</span>
            <p>Pequenas descobertas podem se tornar grandes projetos.</p>
            <button onClick={() => setActivePage("Laboratório de ideias")}>
              Explorar ideias <ArrowUpRight size={13} />
            </button>
          </div>

          <button className="garden-nav-item settings-link">
            <Settings size={17} strokeWidth={1.8} />
            <span>Configurações</span>
          </button>

          <div className="sidebar-profile">
            <div className="profile-avatar">W</div>
            <div className="profile-info">
              <strong>Willian</strong>
              <small>Conta pessoal</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <section className="garden-main">
        <header className="garden-topbar">
          <div className="topbar-context">
            <span>Meu jardim</span>
            <span className="context-slash">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-tools">
            <label className="garden-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar no jardim..."
              />
              <kbd><Command size={10} /> K</kbd>
            </label>

            <div className="notice-container">
              <button
                className={`icon-action ${noticeOpen ? "is-open" : ""}`}
                onClick={() => setNoticeOpen((value) => !value)}
                aria-label="Notificações"
              >
                <Bell size={18} />
                {pendingCount > 0 && <i />}
              </button>

              {noticeOpen && (
                <div className="notice-popover">
                  <strong>Seu jardim</strong>
                  <p>
                    {pendingCount > 0
                      ? `Você tem ${pendingCount} referência(s) esperando organização.`
                      : "Tudo em ordem. Nenhuma referência pendente."}
                  </p>
                  <button onClick={() => setNoticeOpen(false)}>Fechar</button>
                </div>
              )}
            </div>

            <button
              className="top-capture"
              onClick={() => setShowCapture(true)}
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </button>
          </div>
        </header>

        <div className="garden-content">
          <section className="page-intro">
            <div>
              <div className="intro-date">
                <span className="date-line" />
                QUARTA-FEIRA, 25 DE NOVEMBRO
              </div>
              <h1>Bom dia, Willian<span className="intro-flower">✳</span></h1>
              <p>Um espaço para guardar o que desperta sua curiosidade.</p>
            </div>

            <button
              className="intro-link"
              onClick={() => setActivePage("Biblioteca")}
            >
              Sua biblioteca <ArrowRight size={15} />
            </button>
          </section>

          <section className="garden-hero">
            <div className="hero-copy">
              <span className="hero-overline">
                <Sparkles size={13} /> SEU CONHECIMENTO EM MOVIMENTO
              </span>

              <h2>
                Ideias crescem
                <br />
                quando se <em>conectam.</em>
              </h2>

              <p>
                Cada referência é uma semente. Explore seus interesses,
                descubra novas relações e transforme curiosidade em criação.
              </p>

              <button
                className="hero-button"
                onClick={() => setActivePage("Mapa de conhecimento")}
              >
                Explorar meu jardim <ArrowUpRight size={15} />
              </button>

              <div className="hero-footnote">
                <span className="hero-footnote-dot" />
                SEU ESPAÇO DE DESCOBERTAS
              </div>
            </div>

            <div className="hero-art" aria-label="Ilustração abstrata de conexões entre ideias">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-orbit orbit-three" />

              <svg className="art-connections" viewBox="0 0 460 300" fill="none">
                <path d="M225 146 L120 76 L57 126" />
                <path d="M225 146 L340 67 L397 123" />
                <path d="M225 146 L330 222 L395 195" />
                <path d="M225 146 L111 229 L53 194" />
                <path d="M120 76 L174 33 L340 67" />
                <path d="M111 229 L190 268 L330 222" />
                <path d="M57 126 L53 194" />
                <path d="M397 123 L395 195" />
              </svg>

              <div className="art-node node-main">
                <Sprout size={27} strokeWidth={1.5} />
              </div>
              <div className="art-node node-ai"><Sparkles size={17} /></div>
              <div className="art-node node-design"><Lightbulb size={17} /></div>
              <div className="art-node node-code"><span>{"</>"}</span></div>
              <div className="art-node node-science"><Leaf size={16} /></div>
              <div className="art-node node-small-one" />
              <div className="art-node node-small-two" />

              <span className="art-label label-ai">INTELIGÊNCIA ARTIFICIAL</span>
              <span className="art-label label-design">DESIGN</span>
              <span className="art-label label-code">TECNOLOGIA</span>
              <span className="art-label label-science">CIÊNCIA</span>
            </div>
          </section>

          <section className="garden-summary">
            <div className="summary-intro">
              <span className="summary-kicker">EM SEU JARDIM</span>
              <strong>Um pouco do que você vem cultivando.</strong>
            </div>

            <div className="summary-stat">
              <span className="summary-icon"><Bookmark size={15} /></span>
              <div><strong>{String(references.length).padStart(2, "0")}</strong><small>Referências</small></div>
            </div>

            <div className="summary-stat">
              <span className="summary-icon blue-summary"><Network size={15} /></span>
              <div><strong>{topics.length.toString().padStart(2, "0")}</strong><small>Temas ativos</small></div>
            </div>

            <div className="summary-stat">
              <span className="summary-icon orange-summary"><Lightbulb size={15} /></span>
              <div><strong>08</strong><small>Ideias</small></div>
            </div>

            <div className="summary-stat summary-last">
              <span className="summary-icon purple-summary"><Check size={15} /></span>
              <div><strong>{organizedCount.toString().padStart(2, "0")}</strong><small>Organizadas</small></div>
            </div>
          </section>

          <div className="content-columns">
            <section className="content-primary">
              <div className="section-heading">
                <div>
                  <span className="section-overline">SEU ACERVO</span>
                  <h2>Descobertas recentes</h2>
                  <p>O que chamou sua atenção ultimamente.</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => setActivePage("Biblioteca")}
                >
                  Ver biblioteca <ArrowRight size={14} />
                </button>
              </div>

              <div className="reference-list">
                {filteredReferences.slice(0, 5).map((item, index) => {
                  const Icon = iconByType[item.type];

                  return (
                    <article className="reference-card" key={item.id}>
                      <div className={`reference-symbol symbol-${item.type}`}>
                        <Icon size={19} strokeWidth={1.7} />
                      </div>

                      <div className="reference-main">
                        <div className="reference-category">
                          {item.category}
                          <span>·</span>
                          {item.date}
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.source}</p>
                      </div>

                      <div className="reference-trailing">
                        <span className={`reference-status ${item.status === "Organizado" ? "done" : "waiting"}`}>
                          <i />
                          {item.status}
                        </span>
                        <button aria-label="Abrir referência">
                          <ArrowUpRight size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}

                {filteredReferences.length === 0 && (
                  <div className="empty-references">
                    <Search size={20} />
                    <strong>Nenhuma descoberta encontrada</strong>
                    <span>Tente buscar por outro termo.</span>
                  </div>
                )}
              </div>

              <button
                className="add-inline"
                onClick={() => setShowCapture(true)}
              >
                <Plus size={16} />
                Guardar uma nova descoberta
              </button>
            </section>

            <aside className="content-aside">
              <section className="aside-section topics-section">
                <div className="aside-heading">
                  <div>
                    <span className="section-overline">SEUS INTERESSES</span>
                    <h2>Temas cultivados</h2>
                  </div>
                  <button
                    className="subtle-icon-button"
                    onClick={() => setActivePage("Biblioteca")}
                    aria-label="Ver temas"
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </div>

                <div className="topic-collection">
                  {topics.map((topic, index) => (
                    <div className="topic-entry" key={topic.name}>
                      <span className="topic-number">0{index + 1}</span>
                      <span className="topic-color" style={{ background: topic.color }} />
                      <span className="topic-name">{topic.name}</span>
                      <span className="topic-count">{topic.count}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="aside-text-link"
                  onClick={() => setActivePage("Biblioteca")}
                >
                  Explorar todos os temas <ArrowRight size={14} />
                </button>
              </section>

              <section className="aside-section attention-section">
                <div className="aside-heading">
                  <div>
                    <span className="section-overline">PEQUENOS CUIDADOS</span>
                    <h2>Para revisar</h2>
                  </div>
                  <span className="pending-number">{pendingCount}</span>
                </div>

                {pendingCount > 0 ? (
                  references
                    .filter((item) => item.status === "Pendente")
                    .map((item) => (
                      <div className="pending-entry" key={item.id}>
                        <div className="pending-marker"><Clock3 size={15} /></div>
                        <div className="pending-copy">
                          <strong>{item.title}</strong>
                          <span>Aguardando organização</span>
                        </div>
                        <button
                          onClick={() => organizeReference(item.id)}
                          aria-label="Organizar referência"
                          title="Marcar como organizada"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ))
                ) : (
                  <div className="nothing-pending">
                    <Check size={16} />
                    Tudo em dia. Seu jardim está cuidado.
                  </div>
                )}
              </section>

              <section className="aside-quote">
                <span>“</span>
                <p>O conhecimento não é uma coleção de respostas, mas uma rede de possibilidades.</p>
                <small>UMA LEMBRANÇA DO SEU JARDIM</small>
              </section>
            </aside>
          </div>

          <footer className="garden-footer">
            <span><Sprout size={14} /> garden.</span>
            <span>UM ESPAÇO PARA CULTIVAR CURIOSIDADE.</span>
            <span>FEITO COM CALMA <Leaf size={13} /></span>
          </footer>
        </div>
      </section>

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

            <span className="dialog-overline">ALIMENTAR SEU JARDIM</span>
            <h2>Guardar uma descoberta.</h2>
            <p>Uma ideia, um artigo ou qualquer coisa que você queira revisitar.</p>

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
              <Plus size={17} /> Salvar no meu jardim
            </button>
            <span className="dialog-footnote">Você poderá organizar e conectar essa referência depois.</span>
          </form>
        </div>
      )}
    </main>
  );
}
