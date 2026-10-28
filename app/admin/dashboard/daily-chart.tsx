"use client";

import { useEffect, useRef, useState } from "react";
import type { Bucket } from "@/lib/stats";

const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

const numberFmt = new Intl.NumberFormat("pt-BR");
const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

// Topo do eixo arredondado para 4 divisões limpas (ex.: 0, 5, 10, 15, 20)
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= step) ?? step;
  return nice * 4;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function fullDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${weekdayFmt.format(new Date(`${iso}T12:00:00Z`))}, ${d}/${m}/${y}`;
}

// Gráfico de cliques por dia: linha + área, com cursor vertical e tooltip (mouse, toque e teclado)
export function DailyChart({ data }: { data: Bucket[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) return null;

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const yMax = niceMax(Math.max(...data.map((d) => d.count)));
  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const yTicks = [0, 1, 2, 3, 4].map((k) => (yMax / 4) * k);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerW / 70))));

  function indexFromPointer(clientX: number): number {
    const rect = wrapRef.current!.getBoundingClientRect();
    const rel = (clientX - rect.left - PAD.left) / innerW;
    return Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1))));
  }

  const point = active == null ? null : data[active];
  const tipLeft = active == null ? 0 : Math.min(Math.max(x(active), 70), width - 70);

  return (
    <div
      ref={wrapRef}
      className="chart"
      tabIndex={0}
      role="img"
      aria-label={`Cliques por dia, de ${shortDate(data[0].label)} a ${shortDate(data[data.length - 1].label)}. Use as setas para navegar.`}
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
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.left - 8} y={y(t)} className="axis" textAnchor="end" dominantBaseline="middle">
              {compactFmt.format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text key={d.label} x={x(i)} y={HEIGHT - 8} className="axis" textAnchor="middle">
              {shortDate(d.label)}
            </text>
          ) : null,
        )}
        <path d={area} className="series-area" />
        <path d={line} className="series-line" />
        {point && active != null && (
          <>
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className="crosshair" />
            <circle cx={x(active)} cy={y(point.count)} r={5} className="series-dot" />
          </>
        )}
      </svg>
      {point && (
        <div className="tooltip" style={{ left: tipLeft, top: 4 }}>
          <strong>{numberFmt.format(point.count)} cliques</strong>
          <span>{fullDate(point.label)}</span>
        </div>
      )}
    </div>
  );
}
