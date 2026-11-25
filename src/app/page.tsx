
"use client";

import { useMemo, useState } from "react";
import {
  Sprout,
  LayoutDashboard,
  Library,
  Network,
  Lightbulb,
  FolderKanban,
  CalendarDays,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  MoreHorizontal,
  Leaf,
  BookOpen,
  Globe,
  FileText,
  Video,
  X,
  Sparkles,
  Command,
  Settings2,
  ChevronDown,
} from "lucide-react";

const navigation = [
  {
    label: "YOUR SPACE",
    items: [
      { name: "Overview", icon: LayoutDashboard },
      { name: "My garden", icon: Library },
      { name: "Knowledge map", icon: Network },
      { name: "Ideas lab", icon: Lightbulb },
    ],
  },
  {
    label: "ORGANIZE",
    items: [
      { name: "Projects", icon: FolderKanban },
      { name: "Events", icon: CalendarDays },
    ],
  },
];

const initialReferences = [
  {
    id: 1,
    title: "The age of AI agents",
    source: "Anthropic · Research",
    category: "Artificial Intelligence",
    type: "article",
    date: "Today",
    color: "sage",
  },
  {
    id: 2,
    title: "Designing with simplicity",
    source: "Web · Design",
    category: "Design",
    type: "website",
    date: "Yesterday",
    color: "sand",
  },
  {
    id: 3,
    title: "How the brain learns",
    source: "YouTube · Video",
    category: "Neuroscience",
    type: "video",
    date: "Nov 22",
    color: "blue",
  },
];

const typeIcons = {
  article: FileText,
  website: Globe,
  video: Video,
};

export default function Home() {
  const [activePage, setActivePage] = useState("Overview");
  const [search, setSearch] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [references, setReferences] = useState(initialReferences);

  const filteredReferences = useMemo(
    () =>
      references.filter((reference) =>
        `${reference.title} ${reference.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [references, search]
  );

  function addReference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim()) return;

    setReferences((current) => [
      {
        id: Date.now(),
        title: newTitle.trim(),
        source: "Added manually",
        category: "Uncategorized",
        type: "article",
        date: "Just now",
        color: "sage",
      },
      ...current,
    ]);

    setNewTitle("");
    setShowCapture(false);
  }

  return (
    <main className="garden-shell">
      <aside className="sidebar">
        <a href="#" className="brand">
          <span className="brand-icon">
            <Sprout size={21} strokeWidth={1.7} />
          </span>
          <span>garden<span className="brand-dot">.</span></span>
        </a>

        <div className="workspace">
          <div className="workspace-avatar">W</div>
          <div className="workspace-info">
            <strong>Personal space</strong>
            <span>Free garden</span>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <nav className="navigation">
          {navigation.map((section) => (
            <div className="nav-section" key={section.label}>
              <p className="nav-label">{section.label}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => setActivePage(item.name)}
                    className={`nav-item ${active ? "active" : ""}`}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.name}</span>
                    {item.name === "My garden" && (
                      <span className="nav-count">{references.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="garden-tip">
            <div className="tip-icon">
              <Leaf size={17} />
            </div>
            <p className="tip-title">A little reminder</p>
            <p className="tip-text">
              Great ideas grow when you give them room to connect.
            </p>
          </div>

          <button className="nav-item settings-button">
            <Settings2 size={17} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="profile-avatar">W</div>
            <div className="profile-info">
              <strong>My account</strong>
              <span>Personal workspace</span>
            </div>
            <MoreHorizontal size={18} className="muted-icon" />
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>My space</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your garden..."
              />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="capture-button"
              onClick={() => setShowCapture(true)}
            >
              <Plus size={17} />
              <span>Capture</span>
            </button>
          </div>
        </header>

        <div className="dashboard">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                YOUR PERSONAL KNOWLEDGE SPACE
              </div>
              <h1>
                Everything you discover,
                <br />
                <em>has a place to grow.</em>
              </h1>
              <p className="welcome-description">
                A quiet space for curious minds. Collect ideas, connect
                knowledge and grow something meaningful.
              </p>
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="decoration-circle circle-one" />
              <div className="decoration-circle circle-two" />
              <Sprout size={84} strokeWidth={0.8} />
              <span className="decoration-sparkle">✳</span>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat">
              <span className="stat-label">COLLECTED</span>
              <div className="stat-value">
                {references.length.toString().padStart(2, "0")}
                <span className="stat-unit">references</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-label">CULTIVATING</span>
              <div className="stat-value">
                04<span className="stat-unit">topics</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-label">GROWING</span>
              <div className="stat-value">
                08<span className="stat-unit">ideas</span>
              </div>
            </div>
            <div className="stat-note">
              <Sparkles size={15} />
              <span>Your garden is just getting started.</span>
            </div>
          </div>

          <div className="content-grid">
            <section className="references-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">THE COLLECTION</span>
                  <h2>Recently planted</h2>
                  <p>A few things you've brought into your garden.</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => setActivePage("My garden")}
                >
                  Explore all <ArrowUpRight size={15} />
                </button>
              </div>

              <div className="reference-list">
                {filteredReferences.length > 0 ? (
                  filteredReferences.map((reference) => {
                    const Icon =
                      typeIcons[reference.type as keyof typeof typeIcons];

                    return (
                      <article className="reference-item" key={reference.id}>
                        <div className={`reference-icon ${reference.color}`}>
                          <Icon size={20} strokeWidth={1.6} />
                        </div>
                        <div className="reference-content">
                          <h3>{reference.title}</h3>
                          <p>
                            {reference.source}
                            <span>·</span>
                            {reference.category}
                          </p>
                        </div>
                        <span className="reference-date">{reference.date}</span>
                        <button className="more-button" aria-label="More options">
                          <MoreHorizontal size={18} />
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <Search size={22} />
                    <p>No references found.</p>
                  </div>
                )}
              </div>

              <button
                className="add-reference"
                onClick={() => setShowCapture(true)}
              >
                <Plus size={17} />
                Plant something new
              </button>
            </section>

            <aside className="right-column">
              <section className="map-card">
                <div className="card-topline">
                  <span className="section-kicker">YOUR KNOWLEDGE</span>
                  <button
                    className="icon-button"
                    aria-label="Explore knowledge map"
                    onClick={() => setActivePage("Knowledge map")}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <h2>Everything is<br /><em>connected.</em></h2>
                <p>
                  Your references are the beginning of something bigger.
                </p>

                <div className="mini-graph">
                  <svg viewBox="0 0 300 145" role="img" aria-label="Illustration of connected knowledge nodes">
                    <path d="M150 72 L78 30 M150 72 L222 30 M150 72 L65 112 M150 72 L230 112 M78 30 L65 112 M222 30 L230 112" />
                    <circle cx="150" cy="72" r="23" className="graph-center" />
                    <circle cx="78" cy="30" r="13" className="graph-node sage-node" />
                    <circle cx="222" cy="30" r="13" className="graph-node gold-node" />
                    <circle cx="65" cy="112" r="11" className="graph-node blue-node" />
                    <circle cx="230" cy="112" r="11" className="graph-node sage-node" />
                    <circle cx="150" cy="72" r="5" className="graph-dot" />
                    <circle cx="78" cy="30" r="3" className="graph-dot" />
                    <circle cx="222" cy="30" r="3" className="graph-dot" />
                    <circle cx="65" cy="112" r="3" className="graph-dot" />
                    <circle cx="230" cy="112" r="3" className="graph-dot" />
                  </svg>
                  <span className="graph-label label-top">AI</span>
                  <span className="graph-label label-right">Design</span>
                  <span className="graph-label label-left">Ideas</span>
                </div>

                <button
                  className="map-link"
                  onClick={() => setActivePage("Knowledge map")}
                >
                  Explore your knowledge map <ArrowRight size={15} />
                </button>
              </section>

              <section className="discovery-card">
                <div className="discovery-icon">
                  <Sparkles size={17} />
                </div>
                <div>
                  <span className="section-kicker">A LITTLE DISCOVERY</span>
                  <h3>Good things take roots.</h3>
                  <p>
                    Save different perspectives on the same subject. That's
                    where unexpected connections begin.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <footer className="dashboard-footer">
            <span>GROW AT YOUR OWN PACE.</span>
            <span>MADE FOR THE CURIOUS <span className="footer-flower">✳</span></span>
          </footer>
        </div>
      </section>

      {showCapture && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCapture(false);
          }}
        >
          <form className="capture-modal" onSubmit={addReference}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowCapture(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Sprout size={23} />
            </div>
            <span className="section-kicker">NEW DISCOVERY</span>
            <h2>Plant a new idea.</h2>
            <p>
              Start with a title. Later, your garden will help you understand
              and connect it.
            </p>
            <label htmlFor="reference-title">What did you discover?</label>
            <input
              id="reference-title"
              autoFocus
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="An article, an idea, a discovery..."
            />
            <button className="modal-submit" type="submit">
              Add to my garden <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
