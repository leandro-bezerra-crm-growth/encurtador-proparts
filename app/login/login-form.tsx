"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { LogoMark } from "../admin/ui";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="card login">
      <div className="logo">
        <LogoMark />
        <span>
          Prop<b>arts</b>
        </span>
      </div>
      <h1>Encurtador de links</h1>
      <p>Digite a senha de acesso da equipe.</p>
      <label>
        Senha de acesso
        <input type="password" name="password" required autoFocus autoComplete="current-password" />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        <Lock size={16} aria-hidden="true" />
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
