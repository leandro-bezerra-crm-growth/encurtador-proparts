"use client";

import { useActionState } from "react";
import type { Link } from "@/lib/links";
import type { LinkFormState } from "./actions";

type Props = {
  action: (prev: LinkFormState, formData: FormData) => Promise<LinkFormState>;
  link?: Link;
  shortBase: string;
  submitLabel: string;
};

const UTM_LABELS = [
  ["utm_source", "Origem (utm_source)", "instagram, email, google"],
  ["utm_medium", "Mídia (utm_medium)", "social, cpc, newsletter"],
  ["utm_campaign", "Campanha (utm_campaign)", "black-friday-2026"],
  ["utm_content", "Conteúdo (utm_content)", "banner-topo"],
  ["utm_term", "Termo (utm_term)", ""],
] as const;

export function LinkForm({ action, link, shortBase, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const hasUtm = UTM_LABELS.some(([name]) => link?.[name]);

  return (
    <form action={formAction} className="link-form">
      <label className="wide">
        URL de destino *
        <input type="url" name="url" required defaultValue={link?.url} placeholder="https://www.garmin.com.br/..." />
      </label>
      <label>
        Código curto {link ? "*" : "(vazio = automático)"}
        <span className="prefixed">
          <span>{shortBase.replace(/^https?:\/\//, "")}/</span>
          <input name="slug" defaultValue={link?.slug} required={!!link} pattern="[A-Za-z0-9_\-]{2,64}" placeholder="bf-garmin" />
        </span>
      </label>
      <label>
        Título (uso interno)
        <input name="title" defaultValue={link?.title ?? ""} placeholder="Post Instagram Forerunner" />
      </label>
      <label>
        Campanha (agrupador)
        <input name="campaign" defaultValue={link?.campaign ?? ""} placeholder="black-friday-2026" />
      </label>

      <details className="wide" open={hasUtm}>
        <summary>Parâmetros UTM (opcional)</summary>
        <div className="utm-grid">
          {UTM_LABELS.map(([name, label, placeholder]) => (
            <label key={name}>
              {label}
              <input name={name} defaultValue={link?.[name] ?? ""} placeholder={placeholder} />
            </label>
          ))}
        </div>
      </details>

      <div className="wide form-footer">
        <button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        {state.error && <p className="error">{state.error}</p>}
        {state.ok && <p className="ok">{state.ok}</p>}
      </div>
    </form>
  );
}
