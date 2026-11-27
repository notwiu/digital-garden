
import type { Node, Edge } from "@xyflow/react";
import type { Reference } from "@/services/references";

export type KnowledgeNodeData = {
  label: string;
  kind: "garden" | "category" | "reference";
  count?: number;
  referenceId?: string;
  referenceType?: Reference["type"];
  highlighted?: boolean;
  dimmed?: boolean;
};

export type KnowledgeNode = Node<
  KnowledgeNodeData,
  "knowledge"
>;

export function buildKnowledgeMap(
  references: Reference[]
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

  return { nodes, edges };
}
