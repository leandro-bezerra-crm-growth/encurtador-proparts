import NextLink from "next/link";
import { requireSession } from "@/lib/auth";
import { formatNumber } from "@/lib/links";
import { dayLabel, deviceLabel, parsePeriod, PERIOD_OPTIONS, type DashboardStats } from "@/lib/stats";
import { db } from "@/lib/supabase";
import { StatsFootnote } from "../stats-blocks";
import { BarList } from "./bar-list";
import { DailyChart } from "./daily-chart";

function Delta({ current, previous, days }: { current: number; previous: number; days: number }) {
  if (previous === 0) {
    return <span className="delta neutral">{current > 0 ? "sem cliques no período anterior" : "—"}</span>;
  }
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  return (
    <span className={`delta ${change === 0 ? "neutral" : up ? "up" : "down"}`}>
      <span aria-hidden="true">{change === 0 ? "→" : up ? "▲" : "▼"}</span> {up && change > 0 ? "+" : ""}
      {change.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. {days} dias anteriores
    </span>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin/dashboard">) {
  await requireSession();
  const days = parsePeriod((await searchParams).dias);

  const { data, error } = await db().rpc("dashboard_stats", { p_days: days });
  if (error) throw new Error(error.message);
  const s = data as DashboardStats;

  const peak = s.by_day.reduce((best, d) => (d.count > best.count ? d : best), { label: "", count: 0 });

  return (
    <>
      <div className="list-header">
        <h1>Dashboard</h1>
        <div className="actions">
          {PERIOD_OPTIONS.map((d) => (
            <NextLink key={d} href={`/admin/dashboard?dias=${d}`} className={`button small ${d === days ? "" : "secondary"}`}>
              {d} dias
            </NextLink>
          ))}
        </div>
      </div>

      <section className="card">
        <div className="hero">
          <span className="muted">Cliques nos últimos {days} dias</span>
          <strong className="hero-value">{formatNumber(s.total)}</strong>
          <Delta current={s.total} previous={s.previous} days={days} />
        </div>
        <div className="kpis">
          <div>
            <span className="muted small-text">Média por dia</span>
            <strong>{(s.total / days).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</strong>
          </div>
          <div>
            <span className="muted small-text">Dia de pico</span>
            <strong>{peak.count ? `${dayLabel(peak.label)} · ${formatNumber(peak.count)}` : "—"}</strong>
          </div>
          <div>
            <span className="muted small-text">Links com clique</span>
            <strong>
              {formatNumber(s.links_with_clicks)} de {formatNumber(s.active_links)} ativos
            </strong>
          </div>
          <div>
            <span className="muted small-text">Campanhas com clique</span>
            <strong>{formatNumber(s.campaigns_with_clicks)}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Cliques por dia</h2>
        <DailyChart data={s.by_day} />
        <details className="table-view">
          <summary>Ver como tabela</summary>
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th className="num">Cliques</th>
              </tr>
            </thead>
            <tbody>
              {[...s.by_day].reverse().map((d) => (
                <tr key={d.label}>
                  <td>{dayLabel(d.label)}</td>
                  <td className="num">{formatNumber(d.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="dash-grid">
        <section className="card">
          <h2>Campanhas</h2>
          <BarList
            total={s.total}
            items={s.by_campaign.map((c) => ({
              ...c,
              href: c.label === "(sem campanha)" ? undefined : `/admin/campanhas/${encodeURIComponent(c.label)}`,
            }))}
          />
        </section>
        <section className="card">
          <h2>Origem do clique</h2>
          <BarList total={s.total} items={s.by_referrer} />
        </section>
        <section className="card">
          <h2>Dispositivo</h2>
          <BarList total={s.total} items={s.by_device.map((d) => ({ ...d, label: deviceLabel(d.label) }))} />
        </section>
      </div>

      <section className="card">
        <h2>Top 10 links</h2>
        {s.top_links.length === 0 ? (
          <p className="muted">Sem cliques no período.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Título</th>
                  <th>Campanha</th>
                  <th className="num">Cliques</th>
                  <th className="num">% do total</th>
                </tr>
              </thead>
              <tbody>
                {s.top_links.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <NextLink href={`/admin/links/${l.id}`} className="slug">
                        /{l.slug}
                      </NextLink>
                    </td>
                    <td>{l.title ?? <span className="muted">—</span>}</td>
                    <td>
                      {l.campaign ? (
                        <NextLink href={`/admin/campanhas/${encodeURIComponent(l.campaign)}`}>{l.campaign}</NextLink>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="num">{formatNumber(l.count)}</td>
                    <td className="num">{((l.count / s.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <StatsFootnote bots={s.bots} />
      </section>
    </>
  );
}
