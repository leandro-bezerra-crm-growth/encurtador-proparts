import { randomInt } from "node:crypto";

export type Link = {
  id: number;
  slug: string;
  url: string;
  title: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  active: boolean;
  clicks: number;
  created_at: string;
  updated_at: string;
};

export const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

// Caminhos usados pelo próprio app; não podem virar link curto
const RESERVED_SLUGS = new Set(["admin", "login", "api", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]);

const SLUG_PATTERN = /^[A-Za-z0-9_-]{2,64}$/;
const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/l/I

export function generateSlug(length = 6): string {
  let slug = "";
  for (let i = 0; i < length; i++) slug += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  return slug;
}

export function validateSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Use de 2 a 64 caracteres: letras, números, hífen ou sublinhado.";
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return "Esse código é reservado pelo sistema.";
  return null;
}

export function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "A URL precisa começar com http:// ou https://.";
    return null;
  } catch {
    return "URL inválida.";
  }
}

// URL final do redirecionamento, com as UTMs do link aplicadas.
// Parâmetros que chegam no link curto (fbclid, gclid, parâmetros de anúncio) são repassados,
// exceto quando o destino ou as UTMs do link já definem o mesmo parâmetro.
export function buildDestination(
  link: Pick<Link, "url" | (typeof UTM_FIELDS)[number]>,
  incoming?: URLSearchParams,
): string {
  const url = new URL(link.url);
  for (const field of UTM_FIELDS) {
    const value = link[field];
    if (value) url.searchParams.set(field, value);
  }
  incoming?.forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.append(key, value);
  });
  return url.toString();
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" }).format(new Date(iso));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}
