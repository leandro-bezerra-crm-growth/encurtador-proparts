import { ArrowRight, Calendar, Plus, Search } from "lucide-react";
import NextLink from "next/link";
import { requireSession } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/links";
import { db } from "@/lib/supabase";
import { initial, PageHeader } from "../ui";

type Campaign = { name: string; links: number; active: number; clicks: number; first: string; last: string };

const SORTS = {
  recentes: { label: "Mais recentes", fn: (a: Campaign, b: Campaign) => b.last.localeCompare(a.last) },
  cliques: { label: "Mais cliques", fn: (a: Campaign, b: Campaign) => b.clicks - a.clicks },
  nome: { label: "Nome (A–Z)", fn: (a: Campaign, b: Campaign) => a.name.localeCompare(b.name, "pt-BR") },
} as const;

export default async function CampaignsPage({ searchParams }: PageProps<"/admin/campanhas">) {
  await requireSession();
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const sort = (String(params.ordem ?? "") in SORTS ? String(params.ordem) : "recentes") as keyof typeof SORTS;

  const { data, error } = await db().from("links").select("campaign, clicks, active, created_at").limit(10000);
  if (error) throw new Error(error.message);

  const byName = new Map<string, Campaign>();
  let withoutCampaign = 0;
  for (const row of data ?? []) {
    if (!row.campaign) {
      withoutCampaign++;
      continue;
    }
    const c = byName.get(row.campaign) ?? { name: row.campaign, links: 0, active: 0, clicks: 0, first: row.created_at, last: row.created_at };
    c.links++;
    if (row.active) c.active++;
    c.clicks += Number(row.clicks);
    if (row.created_at < c.first) c.first = row.created_at;
    if (row.created_at > c.last) c.last = row.created_at;
    byName.set(row.campaign, c);
  }

  const all = [...byName.values()];
  const totalClicks = all.reduce((sum, c) => sum + c.clicks, 0);
  const best = [...all].sort(SORTS.cliques.fn)[0];
  const needle = q.toLocaleLowerCase("pt-BR");
  const campaigns = all.filter((c) => !needle || c.name.toLocaleLowerCase("pt-BR").includes(needle)).sort(SORTS[sort].fn);

  return (
    <>
      <PageHeader
        title="Campanhas"
        subtitle="Agrupe seus links e compare resultados"
        actions={
          <NextLink href="/admin/links#novo" className="button">
            <Plus size={16} aria-hidden="true" /> <span className="label-wide">Criar link</span>
          </NextLink>
        }
      />
      <div className="container">
        <section className="card summary-strip">
          <div>
            <span>Cliques em campanhas</span>
            <strong>{formatNumber(totalClicks)}</strong>
            <span className="small-text" style={{ margin: "6px 0 0" }}>
              total desde a criação dos links
            </span>
          </div>
          <div>
            <span>Melhor campanha</span>
            <strong title={best?.name}>{best?.name ?? "—"}</strong>
            <span className="small-text" style={{ margin: "6px 0 0" }}>
              {best ? `${formatNumber(best.clicks)} cliques acumulados` : "nenhuma campanha ainda"}
            </span>
          </div>
          <div>
            <span>Campanhas</span>
            <strong>{formatNumber(all.length)}</strong>
            <span className="small-text" style={{ margin: "6px 0 0" }}>
              {formatNumber(withoutCampaign)} {withoutCampaign === 1 ? "link sem campanha" : "links sem campanha"}
            </span>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h2>Todas as campanhas</h2>
            <p>Acompanhe seus agrupadores e resultados.</p>
          </div>
          <form className="toolbar" role="search">
            <div className="search">
              <Search size={16} aria-hidden="true" />
              <input name="q" defaultValue={q} placeholder="Buscar campanha" aria-label="Buscar campanha" />
            </div>
            <select name="ordem" defaultValue={sort} aria-label="Ordenar">
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="secondary">
              Aplicar
            </button>
          </form>
        </div>

        {campaigns.length === 0 ? (
          <section className="card">
            <p className="empty">
              {all.length === 0
                ? "Nenhuma campanha ainda. Preencha o campo Campanha ao criar um link para agrupá-lo aqui."
                : "Nenhuma campanha encontrada para essa busca."}
            </p>
          </section>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((c) => {
              const share = totalClicks ? (c.clicks / totalClicks) * 100 : 0;
              const href = `/admin/campanhas/${encodeURIComponent(c.name)}`;
              return (
                <section key={c.name} className="card campaign-card">
                  <div className="campaign-card-top">
                    <span className="avatar">{initial(c.name)}</span>
                    {c.active > 0 ? <span className="pill success dot">Ativa</span> : <span className="pill dot">Pausada</span>}
                  </div>
                  <div>
                    <h3>{c.name}</h3>
                    <p className="muted small-text" style={{ margin: "6px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={13} aria-hidden="true" />
                      {formatDate(c.first) === formatDate(c.last) ? formatDate(c.first) : `${formatDate(c.first)} — ${formatDate(c.last)}`}
                    </p>
                  </div>
                  <div className="metric-strip">
                    <div>
                      <span>Cliques</span>
                      <strong>{formatNumber(c.clicks)}</strong>
                    </div>
                    <div>
                      <span>Links</span>
                      <strong>{formatNumber(c.links)}</strong>
                    </div>
                    <div>
                      <span>Ativos</span>
                      <strong>{formatNumber(c.active)}</strong>
                    </div>
                  </div>
                  <div>
                    <div className="progress-head">
                      <span>Participação nos cliques</span>
                      <strong>{share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(share, 1)}%` }} />
                    </div>
                  </div>
                  <NextLink href={href} className="button secondary">
                    Ver detalhes <ArrowRight size={15} aria-hidden="true" />
                  </NextLink>
                </section>
              );
            })}
          </div>
        )}
        <p className="muted small-text" style={{ margin: 0 }}>
          Cliques totais desde a criação de cada link, sem robôs. Abra a campanha para ver o relatório por período e exportar CSV.
        </p>
      </div>
    </>
  );
}
