
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setError("Link inválido ou expirado. Solicite outro.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError("Não foi possível atualizar a senha.");
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível concluir a operação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <div className="auth-logo">
            <LockKeyhole size={27} />
          </div>
          <h1>Nova senha</h1>
          <p>Escolha uma nova senha para sua conta.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">Nova senha</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="confirm-password">Confirmar senha</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          <button
            className="auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </section>
    </main>
  );
}
