import { Ellipsis, ExternalLink, Eye, Power } from "lucide-react";
import NextLink from "next/link";
import { formatDate, formatNumber, type Link } from "@/lib/links";
import { setLinkActive } from "./actions";
import { CopyIcon } from "./buttons";

type Row = Pick<Link, "id" | "slug" | "url" | "title" | "campaign" | "active" | "clicks" | "created_at">;

// Tabela de links no padrão do protótipo: título + link curto, campanha em pílula, ações no menu ⋯
export function LinksTable({ links, base }: { links: Row[]; base: string }) {
  const host = base.replace(/^https?:\/\//, "");

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Link / título</th>
            <th>Campanha</th>
            <th className="num">Cliques</th>
            <th>Status</th>
            <th>Criado em</th>
            <th className="num">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={link.id} className={link.active ? "" : "inactive"}>
              <td>
                <div className="cell-title">
                  <strong className="truncate" title={link.url}>
                    {link.title ?? link.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </strong>
                  <span className="short-link">
                    <NextLink href={`/admin/links/${link.id}`}>
                      {host}/{link.slug}
                    </NextLink>
                    <CopyIcon text={`${base}/${link.slug}`} />
                  </span>
                </div>
              </td>
              <td>
                {link.campaign ? (
                  <NextLink href={`/admin/campanhas/${encodeURIComponent(link.campaign)}`} className="pill">
                    {link.campaign}
                  </NextLink>
                ) : (
                  <span className="pill">Sem campanha</span>
                )}
              </td>
              <td className="num strong-num">{formatNumber(Number(link.clicks))}</td>
              <td>{link.active ? <span className="pill success dot">Ativo</span> : <span className="pill dot">Desativado</span>}</td>
              <td className="muted">{formatDate(link.created_at)}</td>
              <td className="num">
                <details className="row-menu">
                  <summary aria-label={`Ações de /${link.slug}`}>
                    <Ellipsis size={18} />
                  </summary>
                  <div className="row-menu-panel">
                    <NextLink href={`/admin/links/${link.id}`}>
                      <Eye size={15} aria-hidden="true" /> Ver detalhes
                    </NextLink>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={15} aria-hidden="true" /> Abrir destino
                    </a>
                    <form action={setLinkActive.bind(null, link.id, !link.active)}>
                      <button type="submit">
                        <Power size={15} aria-hidden="true" /> {link.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
