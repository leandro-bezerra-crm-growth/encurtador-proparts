"use client";

import { LayoutGrid, Link2, LogOut, Megaphone } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logout } from "../login/actions";
import { LogoMark } from "./ui";

export const MENU_CHECKBOX_ID = "menu-toggle";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutGrid, match: (p: string) => p === "/admin" },
  { href: "/admin/links", label: "Meus links", icon: Link2, match: (p: string) => p.startsWith("/admin/links") },
  { href: "/admin/campanhas", label: "Campanhas", icon: Megaphone, match: (p: string) => p.startsWith("/admin/campanhas") },
];

export function Sidebar() {
  const pathname = usePathname();

  // Fecha o menu do celular ao trocar de página
  useEffect(() => {
    const toggle = document.getElementById(MENU_CHECKBOX_ID) as HTMLInputElement | null;
    if (toggle) toggle.checked = false;
  }, [pathname]);

  return (
    <aside className="sidebar">
      <NextLink href="/admin" className="logo">
        <LogoMark />
        <span>
          Prop<b>arts</b>
        </span>
      </NextLink>

      <nav className="nav-group" aria-label="Menu principal">
        <span className="nav-title">Encurtador</span>
        {NAV.map(({ href, label, icon: Icon, match }) => (
          <NextLink key={href} href={href} className="nav-link" aria-current={match(pathname) ? "page" : undefined}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </NextLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <form action={logout}>
          <button type="submit">
            <LogOut size={18} aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
