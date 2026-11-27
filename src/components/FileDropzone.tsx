
"use client";

import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  X,
} from "lucide-react";

import {
  validateFile,
  formatFileSize,
} from "@/services/storage";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function FileDropzone({
  file,
  onChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function selectFile(selected?: File) {
    if (!selected || disabled) return;

    setError("");

    try {
      validateFile(selected);
      onChange(selected);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Arquivo inválido."
      );
    }
  }

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
        hidden
        disabled={disabled}
        onChange={(e) => {
          selectFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className="uploaded-file">
          <span className="uploaded-file-icon">
            <FileText size={23} strokeWidth={1.6} />
          </span>

          <div className="uploaded-file-info">
            <strong>{file.name}</strong>
            <small>{formatFileSize(file.size)}</small>
          </div>

          <button
            type="button"
            disabled={disabled}
            aria-label="Remover arquivo"
            onClick={() => {
              onChange(null);
              setError("");
            }}
          >
            <X size={17} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          className={`file-dropzone ${dragging ? "dragging" : ""
            }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            selectFile(e.dataTransfer.files[0]);
          }}
        >
          <UploadCloud size={30} strokeWidth={1.5} />

          <strong>Arraste seu arquivo até aqui</strong>

          <span>ou clique para selecionar</span>

          <small>
            PDF, PNG, JPG, WEBP, TXT · Até 20 MB
          </small>
        </button>
      )}

      {error && (
        <p className="file-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
