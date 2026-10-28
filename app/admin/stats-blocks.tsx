import { formatNumber } from "@/lib/links";
import { dayLabel, deviceLabel, type Bucket, type ClickStats } from "@/lib/stats";
import { BarList } from "./bar-list";

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
            <td className="num strong-num">{formatNumber(r.count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Detalhamento de cliques (link ou campanha): rankings em barras + tabela por dia
export function StatsGrid({ stats }: { stats: ClickStats }) {
  return (
    <div className="stats-grid">
      <div>
        <h3 className="small-text muted" style={{ marginBottom: 12 }}>
          ORIGEM
        </h3>
        <BarList total={stats.total} items={stats.by_referrer} />
      </div>
      <div>
        <h3 className="small-text muted" style={{ marginBottom: 12 }}>
          DISPOSITIVO
        </h3>
        <BarList total={stats.total} items={stats.by_device.map((r) => ({ ...r, label: deviceLabel(r.label) }))} />
      </div>
      <div>
        <h3 className="small-text muted" style={{ marginBottom: 12 }}>
          PAÍS
        </h3>
        <BarList total={stats.total} items={stats.by_country} />
      </div>
      <StatTable title="Por dia" rows={stats.by_day.map((r) => ({ ...r, label: dayLabel(r.label) }))} />
    </div>
  );
}

export function StatsFootnote({ bots }: { bots: number }) {
  return (
    <p className="muted small-text" style={{ margin: "16px 0 0" }}>
      Fonte: registros de cliques do próprio encurtador. Não guardamos IP nem dados pessoais.
      {bots > 0 && ` Acessos de robôs e pré-visualizações (WhatsApp, redes sociais) desconsiderados no período: ${formatNumber(bots)}.`}
    </p>
  );
}
