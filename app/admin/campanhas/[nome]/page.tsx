import NextLink from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { formatNumber } from "@/lib/links";
import { campaignFromParam, parsePeriod, PERIOD_OPTIONS, type CampaignStats } from "@/lib/stats";
import { db } from "@/lib/supabase";
import { StatsFootnote, StatsGrid } from "../../stats-blocks";

export default async function CampaignReportPage({ params, searchParams }: PageProps<"/admin/campanhas/[nome]">) {
  await requireSession();
  const name = campaignFromParam((await params).nome);
  const days = parsePeriod((await searchParams).dias);
  const base = `/admin/campanhas/${encodeURIComponent(name)}`;

  const { data, error } = await db().rpc("campaign_click_stats", { p_campaign: name, p_days: days });
  if (error) throw new Error(error.message);
  const s = data as CampaignStats;
  if (s.links === 0) notFound();

  const shown = s.by_link.filter((l) => l.count > 0).length;

  return (
    <>
      <p>
        <NextLink href="/admin/campanhas">← Voltar para campanhas</NextLink>
      </p>

      <section className="card">
        <div className="list-header">
          <h2>
            {name} <span className="muted">({formatNumber(s.links)} {s.links === 1 ? "link" : "links"})</span>
          </h2>
          <div className="actions">
            {PERIOD_OPTIONS.map((d) => (
              <NextLink key={d} href={`${base}?dias=${d}`} className={`button small ${d === days ? "" : "secondary"}`}>
                {d} dias
              </NextLink>
            ))}
            <a href={`${base}/csv?dias=${days}`} className="button small secondary" download>
              Exportar CSV
            </a>
          </div>
        </div>
        <div className="kpis">
          <div>
            <span className="muted small-text">Cliques no período</span>
            <strong>{formatNumber(s.total)}</strong>
          </div>
          <div>
            <span className="muted small-text">Links com clique</span>
            <strong>
              {formatNumber(shown)} de {formatNumber(s.links)}
            </strong>
          </div>
          <div>
            <span className="muted small-text">Média por dia</span>
            <strong>{(s.total / days).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Links da campanha · últimos {days} dias</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Link</th>
                <th>Título</th>
                <th className="num">Cliques</th>
                <th className="num">% do total</th>
              </tr>
            </thead>
            <tbody>
              {s.by_link.map((l) => (
                <tr key={l.id}>
                  <td>
                    <NextLink href={`/admin/links/${l.id}`} className="slug">
                      /{l.slug}
                    </NextLink>
                  </td>
                  <td>{l.title ?? <span className="muted">—</span>}</td>
                  <td className="num">{formatNumber(l.count)}</td>
                  <td className="num">{s.total ? `${((l.count / s.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>
          Cliques nos últimos {days} dias <span className="muted">({formatNumber(s.total)})</span>
        </h2>
        {s.total === 0 ? <p className="muted">Nenhum clique no período.</p> : <StatsGrid stats={s} />}
        <StatsFootnote bots={s.bots} />
      </section>
    </>
  );
}
