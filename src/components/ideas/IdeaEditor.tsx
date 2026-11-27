
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { ListChecks } from "lucide-react";

import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
} from "lucide-react";

type Props = {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
};

export default function IdeaEditor({
  content,
  onChange,
}: Props) {
  const editor = useEditor({

    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],

    shouldRerenderOnTransaction: true,


    content,

    immediatelyRender: false,

    editorProps: {
      attributes: {
        class: "idea-editor-content",
        spellcheck: "true",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return (
      <p className="idea-editor-loading">
        Carregando editor...
      </p>
    );
  }

  const tools = [
    {
      label: "Negrito",
      icon: Bold,
      active: editor.isActive("bold"),
      action: () =>
        editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Itálico",
      icon: Italic,
      active: editor.isActive("italic"),
      action: () =>
        editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Tachado",
      icon: Strikethrough,
      active: editor.isActive("strike"),
      action: () =>
        editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Título",
      icon: Heading1,
      active: editor.isActive("heading", { level: 1 }),
      action: () =>
        editor.chain().focus()
          .toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Subtítulo",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      action: () =>
        editor.chain().focus()
          .toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Lista",
      icon: List,
      active: editor.isActive("bulletList"),
      action: () =>
        editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Lista numerada",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      action: () =>
        editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Citação",
      icon: Quote,
      active: editor.isActive("blockquote"),
      action: () =>
        editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Código",
      icon: Code2,
      active: editor.isActive("codeBlock"),
      action: () =>
        editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Desfazer",
      icon: Undo2,
      active: false,
      action: () =>
        editor.chain().focus().undo().run(),
    },
    {
      label: "Refazer",
      icon: Redo2,
      active: false,
      action: () =>
        editor.chain().focus().redo().run(),
    },

    {
      label: "Lista de tarefas",
      icon: ListChecks,
      active: editor.isActive("taskList"),
      action: () =>
        editor.chain().focus().toggleTaskList().run(),
    },

  ];

  return (
    <div className="idea-editor">
      <div className="idea-editor-toolbar">
        {tools.map(({ label, icon: Icon, active, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={active ? "active" : ""}
            onMouseDown={(e) => e.preventDefault()}
            onClick={action}
          >
            <Icon size={17} strokeWidth={1.7} />
          </button>
        ))}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
