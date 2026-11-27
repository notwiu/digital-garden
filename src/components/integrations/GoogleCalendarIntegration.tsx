
"use client";

import { useEffect, useState } from "react";
import { syncGoogleCalendarSafely } from "@/services/google-calendar";

import {
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Link2,
  ExternalLink,
} from "lucide-react";

type IntegrationStatus = {
  connected: boolean;
  calendarReady: boolean;
  syncEnabled: boolean;
  lastSync: string | null;
  connectedAt: string | null;
};

export default function GoogleCalendarIntegration() {
  const [status, setStatus] =
    useState<IntegrationStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/integrations/google/status",
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStatus(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao consultar integração."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();

    function handleSynced() {
      void loadStatus();
    }

    function handleSyncError() {
      setError(
        "Evento salvo localmente. A sincronização com o Google falhou. Tente sincronizar novamente."
      );
    }

    window.addEventListener(
      "google-calendar-synced",
      handleSynced
    );

    window.addEventListener(
      "google-calendar-sync-error",
      handleSyncError
    );

    return () => {
      window.removeEventListener(
        "google-calendar-synced",
        handleSynced
      );

      window.removeEventListener(
        "google-calendar-sync-error",
        handleSyncError
      );
    };
  }, []);

  async function setupCalendar() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        "/api/integrations/google/setup",
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao criar calendário."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (syncing) return;

    setSyncing(true);
    setError("");
    setFeedback("");

    try {
      const success = await syncGoogleCalendarSafely();

      if (!success) {
        throw new Error("Não foi possível sincronizar.");
      }

      await loadStatus();

      setFeedback("Agenda sincronizada com sucesso!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro na sincronização."
      );
    } finally {
      setSyncing(false);
    }
  }
  function connectGoogle() {
    window.location.href =
      "/api/integrations/google/connect";
  }

  return (
    <section className="google-integration">
      <div className="google-integration-header">
        <div className="google-integration-icon">
          <CalendarDays size={23} />
        </div>

        <div className="google-integration-title">
          <h3>Google Calendar</h3>

          <p>
            Conecte sua agenda aos seus dispositivos.
          </p>
        </div>

        {status?.connected && (
          <span className="google-connected">
            <CheckCircle2 size={14} />
            Conectado
          </span>
        )}
      </div>

      {error && (
        <p className="project-error">{error}</p>
      )}

      {feedback && (
        <p className="google-sync-success">
          <CheckCircle2 size={15} />
          {feedback}
        </p>
      )}

      {loading ? (
        <p className="google-integration-muted">
          Verificando integração...
        </p>
      ) : !status ? (
        <button
          className="project-secondary-button"
          onClick={loadStatus}
        >
          Tentar novamente
        </button>
      ) : !status.connected ? (
        <button
          className="project-primary-button"
          onClick={connectGoogle}
        >
          <Link2 size={16} />
          Conectar Google Calendar
        </button>
      ) : (
        <>
          <div className="google-integration-details">
            <div className="google-integration-row">
              <span>Calendário</span>

              <strong>
                {status.calendarReady
                  ? "Digital Garden"
                  : "Não configurado"}
              </strong>
            </div>

            <div className="google-integration-row">
              <span>Última sincronização</span>

              <strong>
                {status.lastSync
                  ? new Date(
                    status.lastSync
                  ).toLocaleString("pt-BR")
                  : "Aguardando"}
              </strong>
            </div>
          </div>

          <div className="google-integration-actions">
            {status.calendarReady && (
              <button
                className="project-primary-button"
                disabled={syncing || busy}
                onClick={handleSync}
              >
                <RefreshCw
                  size={16}
                  className={syncing ? "google-spinning" : ""}
                />

                {syncing ? "Sincronizando..." : "Sincronizar agora"}
              </button>
            )}
            {!status.calendarReady ? (
              <button
                className="project-primary-button"
                disabled={busy}
                onClick={setupCalendar}
              >
                <CalendarDays size={16} />

                {busy
                  ? "Criando calendário..."
                  : "Criar calendário"}
              </button>
            ) : (
              <a
                className="project-secondary-button"
                href="https://calendar.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={15} />
                Abrir Google Calendar
              </a>
            )}

            <button
              className="project-secondary-button"
              disabled={busy}
              onClick={loadStatus}
            >
              <RefreshCw size={15} />
              Atualizar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
