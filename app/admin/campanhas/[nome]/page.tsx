import { Activity, ArrowLeft, Download, Link2, MousePointerClick } from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { formatNumber } from "@/lib/links";
import { campaignFromParam, parsePeriod, type CampaignStats } from "@/lib/stats";
import { db } from "@/lib/supabase";
import { PeriodSelect } from "../../period-select";
import { StatsFootnote, StatsGrid } from "../../stats-blocks";
import { PageHeader } from "../../ui";

export default async function CampaignReportPage({ params, searchParams }: PageProps<"/admin/campanhas/[nome]">) {
  await requireSession();
  const name = campaignFromParam((await params).nome);
  const days = parsePeriod((await searchParams).dias);
  const base = `/admin/campanhas/${encodeURIComponent(name)}`;

  const { data, error } = await db().rpc("campaign_click_stats", { p_campaign: name, p_days: days });
  if (error) throw new Error(error.message);
  const s = data as CampaignStats;
  if (s.links === 0) notFound();

  const withClicks = s.by_link.filter((l) => l.count > 0).length;

  return (
    <>
      <PageHeader
        title={name}
        subtitle={`Relatório da campanha · ${formatNumber(s.links)} ${s.links === 1 ? "link" : "links"}`}
        actions={
          <>
            <PeriodSelect days={days} />
            <a href={`${base}/csv?dias=${days}`} className="button secondary" download>
              <Download size={16} aria-hidden="true" /> <span className="label-wide">Exportar CSV</span>
            </a>
          </>
        }
      />
      <div className="container">
        <NextLink href="/admin/campanhas" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" /> Voltar para Campanhas
        </NextLink>

        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <MousePointerClick size={18} aria-hidden="true" />
              </span>
              Cliques no período
            </div>
            <div className="kpi-value">{formatNumber(s.total)}</div>
            <div className="kpi-foot">últimos {days} dias</div>
          </section>
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <Link2 size={18} aria-hidden="true" />
              </span>
              Links com clique
            </div>
            <div className="kpi-value">
              {formatNumber(withClicks)} <span className="muted" style={{ fontSize: 16 }}>de {formatNumber(s.links)}</span>
            </div>
            <div className="kpi-foot">links da campanha</div>
          </section>
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <Activity size={18} aria-hidden="true" />
              </span>
              Média por dia
            </div>
            <div className="kpi-value">{(s.total / days).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</div>
            <div className="kpi-foot">cliques por dia</div>
          </section>
        </div>

        <section className="card flush">
          <div className="card-header">
            <div>
              <h2>Links da campanha</h2>
              <p>Ranking por cliques nos últimos {days} dias</p>
            </div>
          </div>
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
                      <NextLink href={`/admin/links/${l.id}`} className="link-brand">
                        /{l.slug}
                      </NextLink>
                    </td>
                    <td>{l.title ?? <span className="muted">—</span>}</td>
                    <td className="num strong-num">{formatNumber(l.count)}</td>
                    <td className="num">{s.total ? `${((l.count / s.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Detalhamento dos cliques</h2>
              <p>Origem, dispositivo, país e dia</p>
            </div>
          </div>
          {s.total === 0 ? <p className="empty">Nenhum clique no período.</p> : <StatsGrid stats={s} />}
          <StatsFootnote bots={s.bots} />
        </section>
      </div>
    </>
  );
}
