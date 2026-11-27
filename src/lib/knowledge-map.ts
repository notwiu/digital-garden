
import type { Node, Edge } from "@xyflow/react";
import type { Reference } from "@/services/references";
import type {
  Idea,
  Maturity,
  IdeaConnection,
} from "@/services/ideas";


export type KnowledgeNodeData = {
  label: string;
  kind: "garden" | "category" | "reference" | "idea";
  count?: number;
  referenceId?: string;
  referenceType?: Reference["type"];
  ideaId?: string;
  maturity?: Maturity;
  highlighted?: boolean;
  dimmed?: boolean;
};


export type KnowledgeNode = Node<
  KnowledgeNodeData,
  "knowledge"
>;

export function buildKnowledgeMap(
  references: Reference[],
  ideas: Idea[] = [],
  connections: IdeaConnection[] = []
): {
  nodes: KnowledgeNode[];
  edges: Edge[];
} {
  const nodes: KnowledgeNode[] = [];
  const edges: Edge[] = [];

  const groups = new Map<string, Reference[]>();

  references.forEach((reference) => {
    const category =
      reference.category.trim() || "Sem categoria";

    const items = groups.get(category) ?? [];

    items.push(reference);

    groups.set(category, items);
  });

  const categories = Array.from(groups.entries());

  const largestGroup = Math.max(
    1,
    ...categories.map(([, items]) => items.length)
  );

  const radius = Math.max(
    300,
    categories.length * 85,
    largestGroup * 55
  );

  nodes.push({
    id: "garden",
    type: "knowledge",
    position: { x: 0, y: 0 },
    data: {
      label: "Meu jardim",
      kind: "garden",
      count: references.length,
    },
  });

  categories.forEach(([category, items], index) => {
    const angle =
      (index / categories.length) * Math.PI * 2 -
      Math.PI / 2;

    const categoryId = `category:${category}`;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({
      id: categoryId,
      type: "knowledge",
      position: { x, y },
      data: {
        label: category,
        kind: "category",
        count: items.length,
      },
    });

    edges.push({
      id: `garden:${categoryId}`,
      source: "garden",
      target: categoryId,
      type: "straight",
      style: {
        stroke: "#D8B49E",
        strokeWidth: 1.5,
      },
    });

    const referenceRadius = Math.max(
      150,
      items.length * 42
    );

    items.forEach((reference, itemIndex) => {
      const spread = Math.PI * 0.95;

      const referenceAngle =
        items.length === 1
          ? angle
          : angle -
          spread / 2 +
          (itemIndex / (items.length - 1)) * spread;

      const referenceId = `reference:${reference.id}`;

      nodes.push({
        id: referenceId,
        type: "knowledge",
        position: {
          x: x + Math.cos(referenceAngle) * referenceRadius,
          y: y + Math.sin(referenceAngle) * referenceRadius,
        },
        data: {
          label: reference.title,
          kind: "reference",
          referenceId: reference.id,
          referenceType: reference.type,
        },
      });

      edges.push({
        id: `edge:${referenceId}`,
        source: categoryId,
        target: referenceId,
        type: "straight",
        style: {
          stroke: "#D1D1D6",
          strokeWidth: 1.2,
        },
      });
    });
  });

  // Posicionamento das ideias ao redor do jardim.


  const ideaRadius = Math.max(
    180,
    radius * 0.85,
    (ideas.length * 160) / Math.PI
  );

  ideas.forEach((idea, index) => {
    const angle =
      ideas.length === 1
        ? Math.PI / 2
        : Math.PI / 6 +
        (index / (ideas.length - 1)) *
        ((Math.PI * 2) / 3);

    const nodeId = `idea:${idea.id}`;

    nodes.push({
      id: nodeId,
      type: "knowledge",
      position: {
        x: Math.cos(angle) * ideaRadius,
        y: Math.sin(angle) * ideaRadius,
      },
      data: {
        label: idea.title,
        kind: "idea",
        ideaId: idea.id,
        maturity: idea.maturity,
      },
    });

    edges.push({
      id: `garden:${nodeId}`,
      source: "garden",
      target: nodeId,
      type: "straight",
      style: {
        stroke: "#D6CCE6",
        strokeWidth: 1.5,
      },
    });
  });


  // Conexões reais entre ideias e referências.

  const availableNodes = new Set(
    nodes.map((node) => node.id)
  );

  connections.forEach((connection) => {
    const source = `idea:${connection.idea_id}`;
    const target = `reference:${connection.reference_id}`;

    if (
      !availableNodes.has(source) ||
      !availableNodes.has(target)
    ) {
      return;
    }

    edges.push({
      id: `connection:${source}:${target}`,
      source,
      target,
      type: "straight",
      style: {
        stroke: "#A18BBF",
        strokeWidth: 1.8,
        strokeDasharray: "6 4",
      },
    });
  });

  return { nodes, edges };
}
