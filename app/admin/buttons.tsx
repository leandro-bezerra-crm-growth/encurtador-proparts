"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return { copied, copy };
}

export function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button type="button" className="small secondary" onClick={copy}>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}

// Ícone de copiar ao lado do link curto nas tabelas
export function CopyIcon({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button type="button" className="copy-btn" onClick={copy} aria-label={copied ? "Copiado" : `Copiar ${text}`} title={copied ? "Copiado!" : "Copiar"}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export function ConfirmButton({ message, children, className = "small danger" }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
