
"use client";

import { useEffect, useState } from "react";
import {
  X,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";

import {
  getFileUrl,
  formatFileSize,
} from "@/services/storage";

type Props = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  onClose: () => void;
};

export default function FilePreview({
  path,
  name,
  size,
  mimeType,
  onClose,
}: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getFileUrl(path)
      .then((signedUrl) => {
        if (active) setUrl(signedUrl);
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível carregar o arquivo.");
        }
      });

    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="file-preview-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="file-preview-window"
        role="dialog"
        aria-modal="true"
        aria-label={name}
      >
        <header className="file-preview-header">
          <button
            onClick={onClose}
            aria-label="Fechar visualização"
          >
            <X size={19} />
          </button>

          <div className="file-preview-title">
            <strong>{name}</strong>
            <small>{formatFileSize(size)}</small>
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir arquivo"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </header>

        <div className="file-preview-body">
          {error ? (
            <p role="alert">{error}</p>
          ) : !url ? (
            <Loader2
              size={28}
              className="auth-spinner"
            />
          ) : mimeType.startsWith("image/") ? (
            <img src={url} alt={name} />
          ) : mimeType === "application/pdf" ? (
            <iframe
              src={url}
              title={name}
            />
          ) : (
            <div className="file-preview-empty">
              <FileText size={48} strokeWidth={1.3} />

              <strong>{name}</strong>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir documento
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
