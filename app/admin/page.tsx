import NextLink from "next/link";
import { requireSession } from "@/lib/auth";
import { shortBaseUrl } from "@/lib/base-url";
import { formatDate, formatNumber, type Link } from "@/lib/links";
import { db } from "@/lib/supabase";
import { createLink, setLinkActive } from "./actions";
import { CopyButton } from "./buttons";
import { LinkForm } from "./link-form";

const PAGE_LIMIT = 200;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireSession();
  const params = await searchParams;
  // Remove caracteres que têm significado na sintaxe de filtro do Supabase
  const q = String(params.q ?? "").replace(/[,()*%\\"]/g, " ").trim();
  const campaign = String(params.campanha ?? "");

  let query = db().from("links").select("*").order("created_at", { ascending: false }).limit(PAGE_LIMIT);
  if (q) query = query.or(`slug.ilike.%${q}%,url.ilike.%${q}%,title.ilike.%${q}%`);
  if (campaign) query = query.eq("campaign", campaign);

  const [{ data: links, error }, { data: campaignRows }, base] = await Promise.all([
    query.returns<Link[]>(),
    db().from("links").select("campaign").not("campaign", "is", null).limit(5000),
    shortBaseUrl(),
  ]);
  if (error) throw new Error(error.message);

  const campaigns = [...new Set((campaignRows ?? []).map((r) => r.campaign as string))].sort();
  const totalClicks = (links ?? []).reduce((sum, l) => sum + Number(l.clicks), 0);

  return (
    <>
      <section className="card">
        <h2>Novo link</h2>
        <LinkForm action={createLink} shortBase={base} submitLabel="Criar link" />
      </section>

      <section className="card">
        <div className="list-header">
          <h2>
            Links <span className="muted">({formatNumber(links?.length ?? 0)} · {formatNumber(totalClicks)} cliques)</span>
          </h2>
          <form className="filters">
            <input name="q" defaultValue={q} placeholder="Buscar código, URL ou título" />
            <select name="campanha" defaultValue={campaign}>
              <option value="">Todas as campanhas</option>
              {campaigns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="submit" className="small">
              Filtrar
            </button>
          </form>
        </div>

        {!links?.length ? (
          <p className="muted">Nenhum link encontrado.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Link curto</th>
                  <th>Destino</th>
                  <th>Campanha</th>
                  <th className="num">Cliques</th>
                  <th>Criado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const shortUrl = `${base}/${link.slug}`;
                  return (
                    <tr key={link.id} className={link.active ? "" : "inactive"}>
                      <td>
                        <NextLink href={`/admin/links/${link.id}`} className="slug">
                          /{link.slug}
                        </NextLink>
                        {link.title && <div className="muted small-text">{link.title}</div>}
                        {!link.active && <span className="badge">desativado</span>}
                      </td>
                      <td className="truncate" title={link.url}>
                        {link.url}
                      </td>
                      <td>
                        {link.campaign ? (
                          <NextLink href={`/admin/campanhas/${encodeURIComponent(link.campaign)}`}>{link.campaign}</NextLink>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="num">{formatNumber(Number(link.clicks))}</td>
                      <td>{formatDate(link.created_at)}</td>
                      <td className="actions">
                        <CopyButton text={shortUrl} />
                        <NextLink href={`/admin/links/${link.id}`} className="button small secondary">
                          Detalhes
                        </NextLink>
                        <form action={setLinkActive.bind(null, link.id, !link.active)}>
                          <button type="submit" className="small secondary">
                            {link.active ? "Desativar" : "Ativar"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {links?.length === PAGE_LIMIT && (
          <p className="muted">Mostrando os {PAGE_LIMIT} mais recentes. Use a busca para encontrar links mais antigos.</p>
        )}
      </section>
    </>
  );
}
