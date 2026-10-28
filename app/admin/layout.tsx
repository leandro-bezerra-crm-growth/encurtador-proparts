import NextLink from "next/link";
import { logout } from "../login/actions";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="topbar">
        <NextLink href="/admin" className="brand">
          Encurtador <strong>Proparts</strong>
        </NextLink>
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
