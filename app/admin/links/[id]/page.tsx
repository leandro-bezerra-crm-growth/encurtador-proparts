import { ArrowLeft, ExternalLink, MousePointerClick, Power, Trash2 } from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { shortBaseUrl } from "@/lib/base-url";
import { buildDestination, formatDate, formatNumber, type Link } from "@/lib/links";
import type { ClickStats } from "@/lib/stats";
import { db } from "@/lib/supabase";
import { deleteLink, setLinkActive, updateLink } from "../../actions";
import { ConfirmButton, CopyButton } from "../../buttons";
import { LinkForm } from "../../link-form";
import { StatsFootnote, StatsGrid } from "../../stats-blocks";
import { PageHeader } from "../../ui";

const STATS_DAYS = 30;

export default async function LinkDetailPage({ params }: PageProps<"/admin/links/[id]">) {
  await requireSession();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [{ data: link }, { data: stats, error: statsError }, { data: campaignRows }, base] = await Promise.all([
    db().from("links").select("*").eq("id", id).maybeSingle<Link>(),
    db().rpc("link_click_stats", { p_link_id: id, p_days: STATS_DAYS }),
    db().from("links").select("campaign").not("campaign", "is", null).limit(10000),
    shortBaseUrl(),
  ]);
  if (!link) notFound();
  if (statsError) throw new Error(statsError.message);

  const s = stats as ClickStats;
  const shortUrl = `${base}/${link.slug}`;
  const destination = buildDestination(link);
  const campaigns = [...new Set((campaignRows ?? []).map((r) => r.campaign as string))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <>
      <PageHeader
        title={`/${link.slug}`}
        subtitle={link.title ?? "Detalhes do link"}
        actions={
          <>
            <CopyButton text={shortUrl} />
            <form action={setLinkActive.bind(null, link.id, !link.active)}>
              <button type="submit" className="small secondary">
                <Power size={15} aria-hidden="true" /> {link.active ? "Desativar" : "Ativar"}
              </button>
            </form>
            <form action={deleteLink.bind(null, link.id)}>
              <ConfirmButton message={`Excluir /${link.slug} e todo o histórico de cliques? Isso não pode ser desfeito.`}>
                <Trash2 size={15} aria-hidden="true" /> Excluir
              </ConfirmButton>
            </form>
          </>
        }
      />
      <div className="container">
        <NextLink href="/admin/links" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" /> Voltar para Meus links
        </NextLink>

        <div className="grid-2-1">
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Informações</h2>
                <p>Endereço curto e destino com as UTMs aplicadas</p>
              </div>
              {link.active ? <span className="pill success dot">Ativo</span> : <span className="pill dot">Desativado</span>}
            </div>
            <dl className="facts">
              <dt>Link curto</dt>
              <dd>
                <span className="short-link" style={{ fontSize: 14 }}>
                  {shortUrl.replace(/^https?:\/\//, "")}
                </span>
              </dd>
              <dt>Destino final</dt>
              <dd>
                <a href={destination} target="_blank" rel="noopener noreferrer" className="break" style={{ color: "var(--text-2)" }}>
                  {destination} <ExternalLink size={13} aria-hidden="true" style={{ verticalAlign: "-1px" }} />
                </a>
              </dd>
              <dt>Campanha</dt>
              <dd>
                {link.campaign ? (
                  <NextLink href={`/admin/campanhas/${encodeURIComponent(link.campaign)}`} className="pill">
                    {link.campaign}
                  </NextLink>
                ) : (
                  <span className="pill">Sem campanha</span>
                )}
              </dd>
              <dt>Criado em</dt>
              <dd>{formatDate(link.created_at)}</dd>
            </dl>
          </section>

          <section className="card kpi">
            <div className="kpi-top">
              <span className="icon-tile">
                <MousePointerClick size={18} aria-hidden="true" />
              </span>
              Cliques
            </div>
            <div className="kpi-value">{formatNumber(Number(link.clicks))}</div>
            <div className="kpi-foot">
              <strong>{formatNumber(s.total)}</strong> nos últimos {STATS_DAYS} dias
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Cliques nos últimos {STATS_DAYS} dias</h2>
              <p>Origem, dispositivo, país e dia</p>
            </div>
          </div>
          {s.total === 0 ? <p className="empty">Nenhum clique no período.</p> : <StatsGrid stats={s} />}
          <StatsFootnote bots={s.bots} />
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Editar link</h2>
              <p>Atenção: mudar o código quebra o link curto que já foi divulgado.</p>
            </div>
          </div>
          <LinkForm action={updateLink.bind(null, link.id)} link={link} shortBase={base} submitLabel="Salvar alterações" campaigns={campaigns} />
        </section>
      </div>
    </>
  );
}
