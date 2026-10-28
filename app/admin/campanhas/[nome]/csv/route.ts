import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { campaignFromParam, dayLabel, parsePeriod, type CampaignStats } from "@/lib/stats";
import { db } from "@/lib/supabase";

// CSV no padrão do Excel em português: separador ";" e BOM UTF-8 para acentos.
// Textos que começam com = + - @ ganham um apóstrofo para o Excel não tratá-los como fórmula.
function csvCell(value: string | number | null): string {
  let text = value == null ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function fileSafe(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "campanha";
}

export async function GET(request: NextRequest, ctx: RouteContext<"/admin/campanhas/[nome]/csv">) {
  await requireSession();
  const name = campaignFromParam((await ctx.params).nome);
  const days = parsePeriod(request.nextUrl.searchParams.get("dias"));

  const { data, error } = await db().rpc("campaign_click_stats", { p_campaign: name, p_days: days });
  if (error) return new Response(`Erro ao gerar relatório: ${error.message}`, { status: 500 });
  const s = data as CampaignStats;

  const titles = new Map(s.by_link.map((l) => [l.slug, l.title]));
  const lines = [
    ["Campanha", "Data", "Link", "Título", "Cliques"],
    ...s.by_day_link.map((r) => [name, dayLabel(r.day), `/${r.slug}`, titles.get(r.slug) ?? "", r.count]),
  ];
  const csv = "﻿" + lines.map((cols) => cols.map(csvCell).join(";")).join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="campanha-${fileSafe(name)}-${days}dias.csv"`,
      "cache-control": "no-store",
    },
  });
}
