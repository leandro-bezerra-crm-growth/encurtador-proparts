"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Bucket } from "@/lib/stats";

const HEIGHT = 260;
const PAD = { top: 16, right: 12, bottom: 28, left: 40 };

const numberFmt = new Intl.NumberFormat("pt-BR");
const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Topo do eixo arredondado para 4 divisões limpas (ex.: 0, 5, 10, 15, 20)
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= step) ?? step;
  return nice * 4;
}

function axisDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]}`;
}

function fullDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${weekdayFmt.format(new Date(`${iso}T12:00:00Z`))}, ${d}/${m}/${y}`;
}

function linePath(values: number[], x: (i: number) => number, y: (v: number) => number): string {
  return values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
}

// Cliques por dia: período atual (linha + área) e anterior (pontilhado), com cursor e tooltip
export function DailyChart({ data, previous }: { data: Bucket[]; previous?: number[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) return null;
  const prev = previous && previous.length === data.length ? previous : undefined;

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const yMax = niceMax(Math.max(...data.map((d) => d.count), ...(prev ?? [0])));
  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const current = data.map((d) => d.count);
  const line = linePath(current, x, y);
  const area = `${line}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const yTicks = [0, 1, 2, 3, 4].map((k) => (yMax / 4) * k);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerW / 72))));

  function indexFromPointer(clientX: number): number {
    const rect = wrapRef.current!.getBoundingClientRect();
    const rel = (clientX - rect.left - PAD.left) / innerW;
    return Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1))));
  }

  const point = active == null ? null : data[active];
  const tipLeft = active == null ? 0 : Math.min(Math.max(x(active), 90), width - 90);

  return (
    <div
      ref={wrapRef}
      className="chart"
      tabIndex={0}
      role="img"
      aria-label={`Cliques por dia, de ${axisDate(data[0].label)} a ${axisDate(data[data.length - 1].label)}. Use as setas para navegar.`}
      onPointerMove={(e) => setActive(indexFromPointer(e.clientX))}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive((a) => a ?? data.length - 1)}
      onBlur={() => setActive(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? data.length) - 1));
        if (e.key === "ArrowRight") setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1));
      }}
    >
      <svg width={width} height={HEIGHT} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.left - 10} y={y(t)} className="axis" textAnchor="end" dominantBaseline="middle">
              {compactFmt.format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text key={d.label} x={x(i)} y={HEIGHT - 6} className="axis" textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>
              {axisDate(d.label)}
            </text>
          ) : null,
        )}
        {prev && <path d={linePath(prev, x, y)} className="series-prev" />}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} className="series-line" />
        {point && active != null && (
          <>
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className="crosshair" />
            {prev && <circle cx={x(active)} cy={y(prev[active])} r={4} className="series-dot prev" />}
            <circle cx={x(active)} cy={y(point.count)} r={5} className="series-dot" />
          </>
        )}
      </svg>
      {point && active != null && (
        <div className="tooltip" style={{ left: tipLeft, top: 0 }}>
          <span className="tooltip-date">{fullDate(point.label)}</span>
          <span className="tooltip-row">
            <span className="key-line" />
            <strong>{numberFmt.format(point.count)} cliques</strong>
          </span>
          {prev && (
            <span className="tooltip-row">
              <span className="key-line prev" />
              <span>{numberFmt.format(prev[active])} no período anterior</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
