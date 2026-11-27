
"use client";

import { memo } from "react";
import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

import {
  Sprout,
  Folder,
  FileText,
  Globe,
  Video,
  Paperclip,
} from "lucide-react";

import type {
  KnowledgeNode as KnowledgeNodeType,
} from "@/lib/knowledge-map";

const referenceIcons = {
  artigo: FileText,
  site: Globe,
  vídeo: Video,
  arquivo: Paperclip,
};

function KnowledgeNode({
  data,
  selected,
}: NodeProps<KnowledgeNodeType>) {
  const Icon =
    data.kind === "garden"
      ? Sprout
      : data.kind === "category"
        ? Folder
        : referenceIcons[data.referenceType ?? "artigo"];

  return (
    <div
      className={[
        "knowledge-node",
        `knowledge-node-${data.kind}`,
        selected ? "node-selected" : "",
        data.highlighted ? "node-highlighted" : "",
        data.dimmed ? "node-dimmed" : "",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="knowledge-handle"
      />


      <div className="knowledge-node-symbol">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={false}
          className="knowledge-handle"
        />

        <Icon
          size={
            data.kind === "garden"
              ? 28
              : data.kind === "category"
                ? 20
                : 15
          }
          strokeWidth={1.7}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          className="knowledge-handle"
        />
      </div>


      <div
        className="knowledge-node-label"
        title={data.label}
      >
        {data.label}
      </div>

      {data.count !== undefined && (
        <small className="knowledge-node-count">
          {data.count}{" "}
          {data.count === 1
            ? "referência"
            : "referências"}
        </small>
      )}

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="knowledge-handle"
      />
    </div>
  );
}

export default memo(KnowledgeNode);
