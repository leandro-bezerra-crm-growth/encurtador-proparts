import NextLink from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { shortBaseUrl } from "@/lib/base-url";
import { buildDestination, formatDate, formatNumber, type Link } from "@/lib/links";
import { db } from "@/lib/supabase";
import { deleteLink, setLinkActive, updateLink } from "../../actions";
import { ConfirmButton, CopyButton } from "../../buttons";
import { LinkForm } from "../../link-form";

type Bucket = { label: string; count: number };
type Stats = { total: number; bots: number; by_day: Bucket[]; by_country: Bucket[]; by_device: Bucket[]; by_referrer: Bucket[] };

const STATS_DAYS = 30;

const DEVICE_LABELS: Record<string, string> = { mobile: "Celular", desktop: "Computador", tablet: "Tablet", "?": "Desconhecido" };

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

  const s = stats as Stats;
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
        {s.total === 0 ? (
          <p className="muted">Nenhum clique no período.</p>
        ) : (
          <div className="stats-grid">
            <StatTable title="Por dia" rows={s.by_day.map((r) => ({ ...r, label: r.label.split("-").reverse().join("/") }))} />
            <StatTable title="Por dispositivo" rows={s.by_device.map((r) => ({ ...r, label: DEVICE_LABELS[r.label] ?? r.label }))} />
            <StatTable title="Por país" rows={s.by_country} />
            <StatTable title="Por origem" rows={s.by_referrer} />
          </div>
        )}
        <p className="muted small-text">
          Fonte: registros de cliques do próprio encurtador. Não guardamos IP nem dados pessoais.
          {s.bots > 0 && ` Acessos de robôs e pré-visualizações (WhatsApp, redes sociais) desconsiderados no período: ${formatNumber(s.bots)}.`}
        </p>
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

function StatTable({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>{title}</th>
          <th className="num">Cliques</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td className="num">{formatNumber(r.count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
