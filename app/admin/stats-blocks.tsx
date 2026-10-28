import { formatNumber } from "@/lib/links";
import { dayLabel, deviceLabel, type Bucket, type ClickStats } from "@/lib/stats";

export function StatTable({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>{title}</th>
          <th className="num">Cliques</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td className="num">{formatNumber(r.count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StatsGrid({ stats }: { stats: ClickStats }) {
  return (
    <div className="stats-grid">
      <StatTable title="Por dia" rows={stats.by_day.map((r) => ({ ...r, label: dayLabel(r.label) }))} />
      <StatTable title="Por dispositivo" rows={stats.by_device.map((r) => ({ ...r, label: deviceLabel(r.label) }))} />
      <StatTable title="Por país" rows={stats.by_country} />
      <StatTable title="Por origem" rows={stats.by_referrer} />
    </div>
  );
}

export function StatsFootnote({ bots }: { bots: number }) {
  return (
    <p className="muted small-text">
      Fonte: registros de cliques do próprio encurtador. Não guardamos IP nem dados pessoais.
      {bots > 0 && ` Acessos de robôs e pré-visualizações (WhatsApp, redes sociais) desconsiderados no período: ${formatNumber(bots)}.`}
    </p>
  );
}
