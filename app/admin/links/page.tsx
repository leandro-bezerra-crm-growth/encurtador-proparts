import { Link2, Search, SlidersHorizontal } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { shortBaseUrl } from "@/lib/base-url";
import { formatNumber, type Link } from "@/lib/links";
import { db } from "@/lib/supabase";
import { createLink } from "../actions";
import { LinkForm } from "../link-form";
import { LinksTable } from "../links-table";
import { PageHeader } from "../ui";

const PAGE_LIMIT = 200;

export default async function LinksPage({ searchParams }: PageProps<"/admin/links">) {
  await requireSession();
  const params = await searchParams;
  // Remove caracteres que têm significado na sintaxe de filtro do Supabase
  const q = String(params.q ?? "").replace(/[,()*%\\"]/g, " ").trim();
  const campaign = String(params.campanha ?? "");
  const status = String(params.status ?? "");

  let query = db().from("links").select("*").order("created_at", { ascending: false }).limit(PAGE_LIMIT);
  if (q) query = query.or(`slug.ilike.%${q}%,url.ilike.%${q}%,title.ilike.%${q}%`);
  if (campaign === "__sem__") query = query.is("campaign", null);
  else if (campaign) query = query.eq("campaign", campaign);
  if (status === "ativos") query = query.eq("active", true);
  if (status === "desativados") query = query.eq("active", false);

  const [{ data: links, error }, { data: campaignRows }, base] = await Promise.all([
    query.returns<Link[]>(),
    db().from("links").select("campaign").not("campaign", "is", null).limit(10000),
    shortBaseUrl(),
  ]);
  if (error) throw new Error(error.message);

  const campaigns = [...new Set((campaignRows ?? []).map((r) => r.campaign as string))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filtered = Boolean(q || campaign || status);

  return (
    <>
      <PageHeader title="Meus links" subtitle="Crie, organize e acompanhe todos os links" />
      <div className="container">
        <section className="card" id="novo">
          <div className="card-header">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="icon-tile">
                <Link2 size={18} aria-hidden="true" />
              </span>
              <div>
                <h2>Encurte um novo link</h2>
                <p>Crie links rastreáveis em poucos segundos.</p>
              </div>
            </div>
          </div>
          <LinkForm action={createLink} shortBase={base} submitLabel="Criar link" campaigns={campaigns} />
        </section>

        <form className="toolbar" role="search">
          <div className="search">
            <Search size={16} aria-hidden="true" />
            <input name="q" defaultValue={q} placeholder="Buscar por código, URL ou título" aria-label="Buscar" />
          </div>
          <select name="campanha" defaultValue={campaign} aria-label="Campanha">
            <option value="">Todas as campanhas</option>
            <option value="__sem__">Sem campanha</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} aria-label="Status">
            <option value="">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="desativados">Desativados</option>
          </select>
          <button type="submit" className="secondary">
            <SlidersHorizontal size={16} aria-hidden="true" /> Filtrar
          </button>
        </form>

        <section className="card flush">
          <div className="card-header">
            <div>
              <h2>{filtered ? "Resultado da busca" : "Todos os links"}</h2>
              <p>
                {formatNumber(links?.length ?? 0)} {links?.length === 1 ? "link encontrado" : "links encontrados"}
              </p>
            </div>
          </div>
          {links?.length ? <LinksTable links={links} base={base} /> : <p className="empty">Nenhum link encontrado.</p>}
          {links?.length === PAGE_LIMIT && (
            <p className="muted small-text" style={{ padding: "0 22px 18px" }}>
              Mostrando os {PAGE_LIMIT} mais recentes. Use a busca para encontrar links mais antigos.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
