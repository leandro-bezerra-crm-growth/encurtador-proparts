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

export const PERIOD_OPTIONS = [7, 30, 90] as const;

export function parsePeriod(value: unknown): number {
  const days = Number(value);
  return (PERIOD_OPTIONS as readonly number[]).includes(days) ? days : 30;
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
