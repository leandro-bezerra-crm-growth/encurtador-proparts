import NextLink from "next/link";
import { formatNumber } from "@/lib/links";

export type BarItem = { label: string; count: number; href?: string };

// Ranking em barras horizontais: nome e valor em cima, barra na cor da marca, % no tooltip
export function BarList({ items, total, empty = "Sem cliques no período." }: { items: BarItem[]; total: number; empty?: string }) {
  if (items.length === 0) return <p className="empty">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));

  return (
    <ul className="bar-list">
      {items.map((item) => {
        const share = total ? (item.count / total) * 100 : 0;
        const pct = share.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
        const tip = `${item.label}: ${formatNumber(item.count)} cliques (${pct}% do total)`;
        return (
          <li key={item.label} title={tip} tabIndex={0} aria-label={tip}>
            <div className="bar-head">
              <span>{item.href ? <NextLink href={item.href}>{item.label}</NextLink> : item.label}</span>
              <span>
                <span className="bar-value">{formatNumber(item.count)}</span> <span className="muted small-text">· {pct}%</span>
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
