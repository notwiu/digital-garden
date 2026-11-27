
"use client";

import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";

import {
  Search,
  Scan,
  Maximize,
  Minimize,
  Network,
  X,
} from "lucide-react";

import "@xyflow/react/dist/style.css";

import KnowledgeNode from "./KnowledgeNode";

import {
  buildKnowledgeMap,
  type KnowledgeNode as KnowledgeNodeType,
} from "@/lib/knowledge-map";

import type {
  Reference,
} from "@/services/references";

const nodeTypes = {
  knowledge: KnowledgeNode,
};

type Props = {
  references: Reference[];
  onOpenReference: (id: string) => void;
};

function MapContent({
  references,
  onOpenReference,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [fullscreen, setFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const { fitView } = useReactFlow();

  const categories = useMemo(
    () =>
      Array.from(
        new Set(references.map((r) => r.category))
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [references]
  );

  const visibleReferences = useMemo(
    () =>
      references.filter(
        (reference) =>
          category === "Todos" ||
          reference.category === category
      ),
    [references, category]
  );

  const graph = useMemo(
    () => buildKnowledgeMap(visibleReferences),
    [visibleReferences]
  );

  const [nodes, setNodes, onNodesChange] =
    useNodesState<KnowledgeNodeType>(graph.nodes);

  useEffect(() => {
    setNodes(graph.nodes);

    const timer = window.setTimeout(() => {
      fitView({
        padding: 0.25,
        duration: 350,
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [graph, setNodes, fitView]);

  const displayedNodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return nodes.map((node) => {
      const matches =
        node.data.label.toLowerCase().includes(query);

      return {
        ...node,
        data: {
          ...node.data,
          highlighted: !!query && matches,
          dimmed: !!query && !matches,
        },
      };
    });
  }, [nodes, search]);

  const matches = search.trim()
    ? displayedNodes.filter(
      (node) => node.data.highlighted
    ).length
    : 0;

  const handleNodeClick: NodeMouseHandler<
    KnowledgeNodeType
  > = (_, node) => {
    if (
      node.data.kind === "reference" &&
      node.data.referenceId
    ) {
      onOpenReference(node.data.referenceId);
    }
  };

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch {
      // Alternativa para navegadores sem Fullscreen API.
      setFullscreen((current) => !current);
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document.fullscreenElement === containerRef.current
      );
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreen(false);
      }
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className={`knowledge-map ${fullscreen ? "map-fullscreen" : ""
        }`}
    >
      <header className="map-toolbar">
        <div className="map-search">
          <Search size={16} />

          <input
            placeholder="Buscar no mapa"
            aria-label="Buscar no mapa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              aria-label="Limpar busca"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="map-toolbar-actions">
          <select
            aria-label="Filtrar por tema"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Todos">
              Todos os temas
            </option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <span className="map-toolbar-divider" />

          <button
            title="Centralizar mapa"
            aria-label="Centralizar mapa"
            onClick={() =>
              fitView({
                padding: 0.25,
                duration: 400,
              })
            }
          >
            <Scan size={18} />
          </button>

          <button
            title="Alternar minimapa"
            aria-label="Alternar minimapa"
            aria-pressed={showMinimap}
            onClick={() => setShowMinimap((v) => !v)}
          >
            <Network size={18} />
          </button>

          <button
            title="Tela cheia"
            aria-label="Alternar tela cheia"
            onClick={toggleFullscreen}
          >
            {fullscreen ? (
              <Minimize size={18} />
            ) : (
              <Maximize size={18} />
            )}
          </button>
        </div>
      </header>

      <div className="map-canvas">
        {visibleReferences.length === 0 ? (
          <div className="map-empty">
            <Network size={38} strokeWidth={1.3} />

            <h3>Seu jardim ainda está vazio</h3>

            <p>
              Adicione referências à biblioteca
              para visualizar suas conexões.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={displayedNodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={handleNodeClick}
            nodeOrigin={[0.5, 0.5]}
            nodesConnectable={false}
            nodesDraggable
            deleteKeyCode={null}
            minZoom={0.15}
            maxZoom={2.5}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            colorMode="light"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1}
              color="#DDDEE3"
            />

            <Controls
              position="bottom-left"
              showInteractive={false}
            />

            {showMinimap && (
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                nodeColor={(node) => {
                  if (node.data.kind === "garden") {
                    return "#E97836";
                  }

                  if (node.data.kind === "category") {
                    return "#F2B48D";
                  }

                  return "#C7C7CE";
                }}
                maskColor="rgba(245, 245, 247, .75)"
              />
            )}
          </ReactFlow>
        )}
      </div>

      <footer className="map-footer">
        <div className="map-legend">
          <span>
            <i className="legend-garden" />
            Jardim
          </span>

          <span>
            <i className="legend-category" />
            Temas
          </span>

          <span>
            <i className="legend-reference" />
            Referências
          </span>
        </div>

        <span className="map-count">
          {search.trim()
            ? `${matches} resultados`
            : `${graph.nodes.length} nós · ${graph.edges.length} conexões`}
        </span>
      </footer>
    </section>
  );
}

export default function KnowledgeMap(props: Props) {
  return (
    <ReactFlowProvider>
      <MapContent {...props} />
    </ReactFlowProvider>
  );
}
