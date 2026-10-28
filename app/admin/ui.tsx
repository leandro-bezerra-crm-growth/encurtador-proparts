import { Link2, Menu, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }} aria-hidden="true">
      <Link2 size={size * 0.56} color="#fff" strokeWidth={2.5} />
    </span>
  );
}

// Cabeçalho fixo de cada página: título, subtítulo e ações (ex.: período, criar link)
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <label htmlFor="menu-toggle" className="button ghost icon-button menu-toggle" aria-label="Abrir menu">
          <Menu size={20} />
        </label>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  );
}

// Variação percentual vs. período anterior (verde = subiu, vermelho = caiu)
export function Delta({ current, previous, suffix }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) {
    return <span className="delta neutral">{current > 0 ? "novo no período" : "—"}</span>;
  }
  const change = ((current - previous) / previous) * 100;
  const dir = change > 0 ? "up" : change < 0 ? "down" : "neutral";
  const Icon = change < 0 ? TrendingDown : TrendingUp;
  return (
    <span className={`delta ${dir}`}>
      <Icon size={14} aria-hidden="true" />
      {change > 0 ? "+" : ""}
      {change.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{suffix ? ` ${suffix}` : ""}
    </span>
  );
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
