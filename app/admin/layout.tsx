import NextLink from "next/link";
import { logout } from "../login/actions";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="topbar">
        <nav className="nav">
          <NextLink href="/admin" className="brand">
            Encurtador <strong>Proparts</strong>
          </NextLink>
          <NextLink href="/admin/dashboard">Dashboard</NextLink>
          <NextLink href="/admin">Links</NextLink>
          <NextLink href="/admin/campanhas">Campanhas</NextLink>
        </nav>
        <form action={logout}>
          <button type="submit" className="small secondary">
            Sair
          </button>
        </form>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
