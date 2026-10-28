import { MENU_CHECKBOX_ID, Sidebar } from "./sidebar";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      {/* Controla o menu lateral no celular (sem JavaScript) */}
      <input type="checkbox" id={MENU_CHECKBOX_ID} className="menu-check sr-only" aria-hidden="true" tabIndex={-1} />
      <div className="shell">
        <Sidebar />
        <label htmlFor={MENU_CHECKBOX_ID} className="backdrop" aria-hidden="true" />
        <div className="content">{children}</div>
      </div>
    </>
  );
}
