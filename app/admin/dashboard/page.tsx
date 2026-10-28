import { redirect } from "next/navigation";

// Endereço antigo do dashboard: agora é a "Visão geral" em /admin
export default async function OldDashboard({ searchParams }: PageProps<"/admin/dashboard">) {
  const dias = (await searchParams).dias;
  redirect(dias ? `/admin?dias=${dias}` : "/admin");
}
