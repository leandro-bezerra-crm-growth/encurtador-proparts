import NextLink from "next/link";
import { formatNumber } from "@/lib/links";

export type BarItem = { label: string; count: number; href?: string };

// Ranking em barras horizontais: uma cor só, valor na ponta, % no tooltip
export function BarList({ items, total, empty = "Sem cliques no período." }: { items: BarItem[]; total: number; empty?: string }) {
  if (items.length === 0) return <p className="muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));

  return (
    <ul className="bar-list">
      {items.map((item) => {
        const share = total ? (item.count / total) * 100 : 0;
        const tip = `${item.label}: ${formatNumber(item.count)} cliques (${share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total)`;
        return (
          <li key={item.label} title={tip} tabIndex={0} aria-label={tip}>
            <span className="bar-label">{item.href ? <NextLink href={item.href}>{item.label}</NextLink> : item.label}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${Math.max(1, (item.count / max) * 100)}%` }} />
              <span className="bar-value">{formatNumber(item.count)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
