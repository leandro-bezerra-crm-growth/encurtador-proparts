import "server-only";
import { headers } from "next/headers";

// Endereço base dos links curtos: SHORT_BASE_URL (ex.: https://prt.link) ou o domínio acessado
export async function shortBaseUrl(): Promise<string> {
  if (process.env.SHORT_BASE_URL) return process.env.SHORT_BASE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
