import { Activity, ArrowRight, Link2, Megaphone, MousePointerClick, Plus, Sparkles, TrendingUp } from "lucide-react";
import NextLink from "next/link";
import { requireSession } from "@/lib/auth";
import { shortBaseUrl } from "@/lib/base-url";
import { formatNumber, type Link } from "@/lib/links";
import { dayLabel, deviceLabel, parsePeriod, periodStartIso, type DashboardStats } from "@/lib/stats";
import { db } from "@/lib/supabase";
import { BarList } from "./bar-list";
import { DailyChart } from "./daily-chart";
import { LinksTable } from "./links-table";
import { PeriodSelect } from "./period-select";
import { StatsFootnote } from "./stats-blocks";
import { Delta, initial, PageHeader } from "./ui";

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

function summary(total: number, previous: number) {
  if (total === 0) return <>Ainda não houve cliques neste período.</>;
  if (previous === 0) return <>Seus links somaram <strong>{formatNumber(total)} cliques</strong> no período.</>;
  const change = Math.round(((total - previous) / previous) * 100);
  if (change === 0) return <>Seus links tiveram <strong>o mesmo volume de cliques</strong> do período anterior.</>;
  return (
    <>
      Seus links tiveram <strong>{Math.abs(change)}% {change > 0 ? "mais" : "menos"} cliques</strong> do que no período anterior.
    </>
  );
}

export default async function OverviewPage({ searchParams }: PageProps<"/admin">) {
  await requireSession();
  const days = parsePeriod((await searchParams).dias);
  const since = periodStartIso(days);

  const [{ data, error }, { data: campaignRows }, { data: recent }, { count: newLinks }, base] = await Promise.all([
    db().rpc("dashboard_stats", { p_days: days }),
    db().from("links").select("campaign").not("campaign", "is", null).limit(10000),
    db().from("links").select("*").order("created_at", { ascending: false }).limit(5).returns<Link[]>(),
    db().from("links").select("id", { count: "exact", head: true }).gte("created_at", since),
    shortBaseUrl(),
  ]);
  if (error) throw new Error(error.message);
  const s = data as DashboardStats;

  const linksPerCampaign = new Map<string, number>();
  for (const r of campaignRows ?? []) linksPerCampaign.set(r.campaign, (linksPerCampaign.get(r.campaign) ?? 0) + 1);
  const peak = s.by_day.reduce((best, d) => (d.count > best.count ? d : best), { label: "", count: 0 });
  const featured = s.by_campaign.filter((c) => c.label !== "(sem campanha)").slice(0, 5);

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Acompanhe a performance dos seus links"
        actions={
          <>
            <PeriodSelect days={days} />
            <NextLink href="/admin/links#novo" className="button">
              <Plus size={16} aria-hidden="true" /> <span className="label-wide">Criar link</span>
            </NextLink>
          </>
        }
      />
      <div className="container">
        <section className="hero">
          <div>
            <div className="hero-eyebrow">
              <Sparkles size={14} aria-hidden="true" /> Resumo do período
            </div>
            <h2>{greeting()}!</h2>
            <p>{summary(s.total, s.previous)}</p>
          </div>
          <div className="hero-badge" aria-hidden="true">
            <TrendingUp size={26} />
          </div>
        </section>

        <div className="kpi-grid">
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <MousePointerClick size={18} aria-hidden="true" />
              </span>
              Total de cliques
            </div>
            <div className="kpi-value">{formatNumber(s.total)}</div>
            <div className="kpi-foot">
              <Delta current={s.total} previous={s.previous} /> vs. período anterior
            </div>
          </section>
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <Link2 size={18} aria-hidden="true" />
              </span>
              Links ativos
            </div>
            <div className="kpi-value">{formatNumber(s.active_links)}</div>
            <div className="kpi-foot">
              <strong className="delta up">+{formatNumber(newLinks ?? 0)}</strong> novos no período
            </div>
          </section>
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <Megaphone size={18} aria-hidden="true" />
              </span>
              Campanhas
            </div>
            <div className="kpi-value">{formatNumber(s.campaigns_with_clicks)}</div>
            <div className="kpi-foot">com clique, de {formatNumber(linksPerCampaign.size)} cadastradas</div>
          </section>
          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <Activity size={18} aria-hidden="true" />
              </span>
              Média por dia
            </div>
            <div className="kpi-value">{(s.total / days).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</div>
            <div className="kpi-foot">{peak.count ? `pico em ${dayLabel(peak.label)}: ${formatNumber(peak.count)}` : "sem pico no período"}</div>
          </section>
        </div>

        <div className="grid-2-1">
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Performance de cliques</h2>
                <p>Cliques totais por dia</p>
              </div>
              <div className="legend" aria-hidden={!s.prev_by_day}>
                <span>
                  <span className="key-line" /> Este período
                </span>
                {s.prev_by_day && (
                  <span>
                    <span className="key-line prev" /> Período anterior
                  </span>
                )}
              </div>
            </div>
            <DailyChart data={s.by_day} previous={s.prev_by_day} />
            <details className="table-view">
              <summary>Ver como tabela</summary>
              <table>
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th className="num">Cliques</th>
                    {s.prev_by_day && <th className="num">Período anterior</th>}
                  </tr>
                </thead>
                <tbody>
                  {s.by_day
                    .map((d, i) => ({ ...d, prev: s.prev_by_day?.[i] }))
                    .reverse()
                    .map((d) => (
                      <tr key={d.label}>
                        <td>{dayLabel(d.label)}</td>
                        <td className="num">{formatNumber(d.count)}</td>
                        {s.prev_by_day && <td className="num">{formatNumber(d.prev ?? 0)}</td>}
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2>Campanhas em destaque</h2>
                <p>Por volume de cliques</p>
              </div>
              <NextLink href="/admin/campanhas" className="link-brand small-text">
                Ver todas <ArrowRight size={14} style={{ verticalAlign: "-2px" }} aria-hidden="true" />
              </NextLink>
            </div>
            {featured.length === 0 ? (
              <p className="empty">Nenhuma campanha com cliques no período.</p>
            ) : (
              <ol className="rank-list">
                {featured.map((c, i) => (
                  <li key={c.label}>
                    <NextLink href={`/admin/campanhas/${encodeURIComponent(c.label)}?dias=${days}`}>
                      <span className="rank-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className={`avatar ${i === 0 ? "" : "neutral"}`}>{initial(c.label)}</span>
                      <span className="rank-name">
                        <strong>{c.label}</strong>
                        <span className="muted small-text">
                          {formatNumber(linksPerCampaign.get(c.label) ?? 0)} {linksPerCampaign.get(c.label) === 1 ? "link" : "links"}
                        </span>
                      </span>
                      <span className="rank-value">
                        <strong>{formatNumber(c.count)}</strong>
                        <span className="muted small-text">cliques</span>
                      </span>
                    </NextLink>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="grid-2">
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Origem do clique</h2>
                <p>De onde vêm os acessos</p>
              </div>
            </div>
            <BarList total={s.total} items={s.by_referrer} />
          </section>
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Dispositivo</h2>
                <p>Como as pessoas acessam</p>
              </div>
            </div>
            <BarList total={s.total} items={s.by_device.map((d) => ({ ...d, label: deviceLabel(d.label) }))} />
          </section>
        </div>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Links recentes</h2>
              <p>Criados recentemente</p>
            </div>
            <NextLink href="/admin/links" className="link-brand small-text">
              Ver todos <ArrowRight size={14} style={{ verticalAlign: "-2px" }} aria-hidden="true" />
            </NextLink>
          </div>
          {recent?.length ? <LinksTable links={recent} base={base} /> : <p className="empty">Nenhum link criado ainda.</p>}
          <StatsFootnote bots={s.bots} />
        </section>
      </div>
    </>
  );
}
