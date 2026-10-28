export type Bucket = { label: string; count: number };

export type ClickStats = {
  total: number;
  bots: number;
  by_day: Bucket[];
  by_country: Bucket[];
  by_device: Bucket[];
  by_referrer: Bucket[];
};

export type CampaignStats = ClickStats & {
  links: number;
  by_link: { id: number; slug: string; title: string | null; count: number }[];
  by_day_link: { day: string; slug: string; count: number }[];
};

export type DashboardStats = {
  total: number;
  previous: number;
  bots: number;
  active_links: number;
  links_with_clicks: number;
  campaigns_with_clicks: number;
  by_day: Bucket[];
  // Só existe depois da migração 004; até lá o gráfico mostra apenas o período atual
  prev_by_day?: number[];
  by_campaign: Bucket[];
  by_referrer: Bucket[];
  by_device: Bucket[];
  top_links: { id: number; slug: string; title: string | null; campaign: string | null; count: number }[];
};

export const PERIOD_OPTIONS = [7, 30, 90] as const;

export function parsePeriod(value: unknown): number {
  const days = Number(value);
  return (PERIOD_OPTIONS as readonly number[]).includes(days) ? days : 30;
}

// Início do período (agora menos N dias), em ISO, para filtros no banco
export function periodStartIso(days: number): string {
  return new Date(Date.now() - days * 864e5).toISOString();
}

// O nome da campanha chega na rota ainda codificado ("Black%20Friday")
export function campaignFromParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

const DEVICE_LABELS: Record<string, string> = { mobile: "Celular", desktop: "Computador", tablet: "Tablet", "?": "Desconhecido" };

export function deviceLabel(device: string): string {
  return DEVICE_LABELS[device] ?? device;
}

// "2026-10-28" -> "28/10/2026"
export function dayLabel(isoDay: string): string {
  return isoDay.split("-").reverse().join("/");
}
