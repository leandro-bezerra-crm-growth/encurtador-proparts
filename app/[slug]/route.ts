import { after, type NextRequest } from "next/server";
import { buildDestination, type Link } from "@/lib/links";
import { db } from "@/lib/supabase";

const BOT_PATTERN = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|slack|telegram|discord|curl|wget/i;
const TABLET_PATTERN = /ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i;
const MOBILE_PATTERN = /mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i;

function deviceType(userAgent: string): string {
  if (!userAgent) return "?";
  if (BOT_PATTERN.test(userAgent)) return "bot";
  if (TABLET_PATTERN.test(userAgent)) return "tablet";
  if (MOBILE_PATTERN.test(userAgent)) return "mobile";
  return "desktop";
}

// Só o domínio de origem (ex.: instagram.com), nunca a URL completa
function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

function notFoundPage(): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link não encontrado</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:64px 16px;color:#222"><h1>Link não encontrado</h1><p>Este link não existe ou foi desativado.</p></body></html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]">) {
  const { slug } = await ctx.params;

  const { data: link } = await db()
    .from("links")
    .select("id, url, active, utm_source, utm_medium, utm_campaign, utm_content, utm_term")
    .eq("slug", slug)
    .maybeSingle<Pick<Link, "id" | "url" | "active" | "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term">>();

  if (!link || !link.active) return notFoundPage();

  const country = request.headers.get("x-vercel-ip-country");
  const device = deviceType(request.headers.get("user-agent") ?? "");
  const referrer = referrerHost(request.headers.get("referer"));

  // Registra o clique depois de responder, sem atrasar o redirecionamento
  after(async () => {
    const { error } = await db().rpc("register_click", {
      p_link_id: link.id,
      p_country: country,
      p_device: device,
      p_referrer: referrer,
    });
    if (error) console.error("Falha ao registrar clique", link.id, error.message);
  });

  // 302 (temporário) para que mudanças de destino passem a valer na hora
  return new Response(null, {
    status: 302,
    headers: { location: buildDestination(link, request.nextUrl.searchParams), "cache-control": "no-store" },
  });
}
