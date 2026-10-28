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

const STATS_DAYS = 30;

export default async function LinkDetailPage({ params }: PageProps<"/admin/links/[id]">) {
  await requireSession();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [{ data: link }, { data: stats, error: statsError }, base] = await Promise.all([
    db().from("links").select("*").eq("id", id).maybeSingle<Link>(),
    db().rpc("link_click_stats", { p_link_id: id, p_days: STATS_DAYS }),
    shortBaseUrl(),
  ]);
  if (!link) notFound();
  if (statsError) throw new Error(statsError.message);

  const s = stats as ClickStats;
  const shortUrl = `${base}/${link.slug}`;
  const destination = buildDestination(link);

  return (
    <>
      <p>
        <NextLink href="/admin">← Voltar para a lista</NextLink>
      </p>

      <section className="card">
        <div className="list-header">
          <h2>
            /{link.slug} {!link.active && <span className="badge">desativado</span>}
          </h2>
          <div className="actions">
            <CopyButton text={shortUrl} />
            <form action={setLinkActive.bind(null, link.id, !link.active)}>
              <button type="submit" className="small secondary">
                {link.active ? "Desativar" : "Ativar"}
              </button>
            </form>
            <form action={deleteLink.bind(null, link.id)}>
              <ConfirmButton message={`Excluir /${link.slug} e todo o histórico de cliques? Isso não pode ser desfeito.`}>Excluir</ConfirmButton>
            </form>
          </div>
        </div>
        <dl className="facts">
          <dt>Link curto</dt>
          <dd>
            <code>{shortUrl}</code>
          </dd>
          <dt>Destino final</dt>
          <dd>
            <code className="break">{destination}</code>
          </dd>
          <dt>Cliques (total)</dt>
          <dd>{formatNumber(Number(link.clicks))}</dd>
          <dt>Criado em</dt>
          <dd>{formatDate(link.created_at)}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>
          Cliques nos últimos {STATS_DAYS} dias <span className="muted">({formatNumber(s.total)})</span>
        </h2>
        {s.total === 0 ? <p className="muted">Nenhum clique no período.</p> : <StatsGrid stats={s} />}
        <StatsFootnote bots={s.bots} />
      </section>

      <section className="card">
        <h2>Editar</h2>
        <LinkForm action={updateLink.bind(null, link.id)} link={link} shortBase={base} submitLabel="Salvar alterações" />
        <p className="muted small-text">
          Atenção: mudar o código quebra o link curto antigo que já foi divulgado.
        </p>
      </section>
    </>
  );
}
