import NextLink from "next/link";
import { requireSession } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/links";
import { db } from "@/lib/supabase";

type CampaignRow = { name: string; links: number; active: number; clicks: number; lastCreated: string };

export default async function CampaignsPage() {
  await requireSession();

  const { data, error } = await db()
    .from("links")
    .select("campaign, clicks, active, created_at")
    .not("campaign", "is", null)
    .limit(10000);
  if (error) throw new Error(error.message);

  const byName = new Map<string, CampaignRow>();
  for (const row of data ?? []) {
    const name = row.campaign as string;
    const c = byName.get(name) ?? { name, links: 0, active: 0, clicks: 0, lastCreated: row.created_at };
    c.links++;
    if (row.active) c.active++;
    c.clicks += Number(row.clicks);
    if (row.created_at > c.lastCreated) c.lastCreated = row.created_at;
    byName.set(name, c);
  }
  const campaigns = [...byName.values()].sort((a, b) => b.lastCreated.localeCompare(a.lastCreated));

  return (
    <section className="card">
      <h2>
        Campanhas <span className="muted">({formatNumber(campaigns.length)})</span>
      </h2>
      {campaigns.length === 0 ? (
        <p className="muted">
          Nenhuma campanha ainda. Preencha o campo <strong>Campanha</strong> ao criar um link para agrupá-lo aqui.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campanha</th>
                <th className="num">Links</th>
                <th className="num">Ativos</th>
                <th className="num">Cliques (total)</th>
                <th>Último link criado</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.name}>
                  <td>
                    <NextLink href={`/admin/campanhas/${encodeURIComponent(c.name)}`} className="slug">
                      {c.name}
                    </NextLink>
                  </td>
                  <td className="num">{formatNumber(c.links)}</td>
                  <td className="num">{formatNumber(c.active)}</td>
                  <td className="num">{formatNumber(c.clicks)}</td>
                  <td>{formatDate(c.lastCreated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small-text">Cliques totais desde a criação de cada link, sem robôs. Clique na campanha para ver o relatório por período.</p>
    </section>
  );
}
