
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.replace("/");
        router.refresh();
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setMessage("Confira seu e-mail para confirmar sua conta.");
        }
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
          }
        );

        if (error) throw error;

        setMessage(
          "Confira seu e-mail para redefinir sua senha."
        );
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "";

      if (detail.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos.");
      } else if (detail.includes("Email not confirmed")) {
        setError("Confirme seu e-mail antes de entrar.");
      } else {
        setError("Não foi possível concluir a operação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <div className="auth-logo">
            <Sprout size={30} strokeWidth={1.7} />
          </div>

          <h1>garden<span>.</span></h1>

          <p>
            {mode === "login" && "Entre no seu espaço pessoal."}
            {mode === "register" && "Comece seu jardim digital."}
            {mode === "reset" && "Recupere o acesso à sua conta."}
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nome@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {mode !== "reset" && (
            <>
              <label htmlFor="password">Senha</label>

              <div className="auth-password">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === "register" ? 8 : undefined}
                  required
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </>
          )}

          {mode === "login" && (
            <button
              type="button"
              className="auth-forgot"
              onClick={() => changeMode("reset")}
            >
              Esqueceu a senha?
            </button>
          )}

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {message && (
            <div className="auth-success" role="status">{message}</div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="auth-spinner" />
            ) : (
              <>
                {mode === "login" && "Entrar"}
                {mode === "register" && "Criar conta"}
                {mode === "reset" && "Enviar link de recuperação"}
              </>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          {mode === "login" ? (
            <>
              Ainda não tem conta?{" "}
              <button onClick={() => changeMode("register")}>
                Criar conta
              </button>
            </>
          ) : (
            <button onClick={() => changeMode("login")}>
              Voltar para o login
            </button>
          )}
        </footer>
      </section>

      <span className="auth-copyright">
        Digital Garden · Seu espaço pessoal
      </span>
    </main>
  );
}
