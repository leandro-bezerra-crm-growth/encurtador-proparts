"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { useActionState, useId } from "react";
import type { Link } from "@/lib/links";
import type { LinkFormState } from "./actions";

type Props = {
  action: (prev: LinkFormState, formData: FormData) => Promise<LinkFormState>;
  link?: Link;
  shortBase: string;
  submitLabel: string;
  campaigns?: string[];
};

const UTM_LABELS = [
  ["utm_source", "Origem (utm_source)", "instagram, email, google"],
  ["utm_medium", "Mídia (utm_medium)", "social, cpc, newsletter"],
  ["utm_campaign", "Campanha (utm_campaign)", "black-friday-2026"],
  ["utm_content", "Conteúdo (utm_content)", "banner-topo"],
  ["utm_term", "Termo (utm_term)", ""],
] as const;

// Criação (URL em destaque com botão embutido) e edição (campos empilhados) do link
export function LinkForm({ action, link, shortBase, submitLabel, campaigns = [] }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const listId = useId();
  const hasUtm = UTM_LABELS.some(([name]) => link?.[name]);
  const isEdit = !!link;
  const submit = (
    <button type="submit" disabled={pending}>
      {!isEdit && <Sparkles size={16} aria-hidden="true" />}
      {pending ? "Salvando…" : submitLabel}
    </button>
  );

  return (
    <form action={formAction} className="link-form">
      {isEdit ? (
        <label>
          URL de destino *
          <input type="url" name="url" required defaultValue={link.url} />
        </label>
      ) : (
        <div>
          <label htmlFor="url-destino" className="hero-input-label">
            URL de destino
          </label>
          <div className="hero-input">
            <input id="url-destino" type="url" name="url" required placeholder="Cole aqui a URL que você quer encurtar" />
            {submit}
          </div>
        </div>
      )}

      <div className="form-row">
        <label>
          Título interno
          <input name="title" defaultValue={link?.title ?? ""} placeholder="Ex.: Post Instagram Forerunner" />
        </label>
        <label>
          Campanha
          <input name="campaign" list={listId} defaultValue={link?.campaign ?? ""} placeholder="Escolha ou digite uma nova" autoComplete="off" />
          <datalist id={listId}>
            {campaigns.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Código personalizado {isEdit && "*"}
          <span className="prefixed">
            <span>{shortBase.replace(/^https?:\/\//, "")}/</span>
            <input
              name="slug"
              defaultValue={link?.slug}
              required={isEdit}
              pattern="[A-Za-z0-9_\-]{2,64}"
              placeholder={isEdit ? "" : "automático"}
            />
          </span>
        </label>
      </div>

      <details className="disclosure" open={hasUtm}>
        <summary>
          <ChevronRight size={16} aria-hidden="true" /> Parâmetros UTM <span className="muted small-text">opcional</span>
        </summary>
        <div className="utm-grid">
          {UTM_LABELS.map(([name, label, placeholder]) => (
            <label key={name}>
              {label}
              <input name={name} defaultValue={link?.[name] ?? ""} placeholder={placeholder} />
            </label>
          ))}
        </div>
      </details>

      {(isEdit || state.error || state.ok) && (
        <div className="form-footer">
          {isEdit && submit}
          {state.error && <p className="error">{state.error}</p>}
          {state.ok && <p className="ok">{state.ok}</p>}
        </div>
      )}
    </form>
  );
}
