
"use client";

import { useEffect, useState } from "react";

import {
  Sprout,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import {
  listReferences,
  type Reference,
} from "@/services/references";

import KnowledgeMap from "./KnowledgeMap";

export default function StandaloneMap() {
  const [references, setReferences] =
    useState<Reference[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    listReferences()
      .then((rows) => {
        if (active) {
          setReferences(rows);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.message ??
            "Não foi possível carregar o mapa."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [version]);

  function openReference(id: string) {
    window.open(
      `/?reference=${encodeURIComponent(id)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function openIdea(id: string) {
    window.open(
      `/?idea=${encodeURIComponent(id)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="standalone-map">
      <header className="standalone-map-header">
        <div className="standalone-map-brand">
          <div className="standalone-map-logo">
            <Sprout size={22} strokeWidth={1.8} />
          </div>

          <div>
            <strong>Digital Garden</strong>
            <span>Mapa de conhecimento</span>
          </div>
        </div>

        <div className="standalone-map-actions">
          <button
            title="Atualizar mapa"
            aria-label="Atualizar mapa"
            disabled={loading}
            onClick={() =>
              setVersion((current) => current + 1)
            }
          >
            <RefreshCw
              size={17}
              className={loading ? "spinning" : ""}
            />
          </button>

          <a href="/">
            <ArrowLeft size={16} />
            Voltar ao jardim
          </a>
        </div>
      </header>

      <div className="standalone-map-content">
        {loading ? (
          <div className="standalone-map-loading">
            <div className="garden-loader" />
            <span>Carregando conhecimento...</span>
          </div>
        ) : error ? (
          <div className="standalone-map-loading">
            <p role="alert">{error}</p>

            <button
              onClick={() =>
                setVersion((current) => current + 1)
              }
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <KnowledgeMap
            key={version}
            references={references}
            onOpenReference={openReference}
            onOpenIdea={openIdea}
          />
        )}
      </div>
    </main>
  );
}
