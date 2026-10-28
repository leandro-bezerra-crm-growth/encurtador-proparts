import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Sessão por senha única: o cookie guarda a data de expiração assinada com SESSION_SECRET.
// Trocar SESSION_SECRET na Vercel derruba todas as sessões abertas.

export const SESSION_COOKIE = "encurtador_sessao";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias, em segundos

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou com menos de 32 caracteres");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

// Compara em tempo constante, sem vazar o tamanho do valor esperado
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD não configurada");
  return safeEqual(input, expected);
}

export function createSessionToken(): string {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > Date.now();
}
