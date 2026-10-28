"use client";

import { Calendar, ChevronDown } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PERIOD_OPTIONS } from "@/lib/stats";

// Botão "Últimos N dias" com menu de opções; a escolha vai na URL (?dias=)
export function PeriodSelect({ days }: { days: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="period" ref={ref}>
      <button type="button" className="secondary" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <Calendar size={16} aria-hidden="true" />
        <span>
          <span className="label-wide">Últimos </span>
          {days} dias
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="period-panel" role="menu">
          {PERIOD_OPTIONS.map((d) => (
            <NextLink
              key={d}
              href={`${pathname}?dias=${d}`}
              role="menuitem"
              aria-current={d === days ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              Últimos {d} dias
            </NextLink>
          ))}
        </div>
      )}
    </div>
  );
}
