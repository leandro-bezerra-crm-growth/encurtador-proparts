"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { generateSlug, UTM_FIELDS, validateSlug, validateUrl } from "@/lib/links";

export type LinkFormState = { error?: string; ok?: string };

const UNIQUE_VIOLATION = "23505";

function text(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? null : value;
}

function parseLinkForm(formData: FormData) {
  const url = text(formData, "url") ?? "";
  const urlError = validateUrl(url);
  if (urlError) return { error: urlError } as const;

  const slug = text(formData, "slug");
  if (slug) {
    const slugError = validateSlug(slug);
    if (slugError) return { error: slugError } as const;
  }

  const fields = {
    url,
    title: text(formData, "title"),
    campaign: text(formData, "campaign"),
    ...Object.fromEntries(UTM_FIELDS.map((f) => [f, text(formData, f)])),
  };
  return { slug, fields } as const;
}

export async function createLink(_prev: LinkFormState, formData: FormData): Promise<LinkFormState> {
  await requireSession();
  const parsed = parseLinkForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Código automático: tenta de novo nos raros casos de colisão
  const attempts = parsed.slug ? 1 : 5;
  for (let i = 0; i < attempts; i++) {
    const slug = parsed.slug ?? generateSlug();
    const { error } = await db().from("links").insert({ slug, ...parsed.fields });
    if (!error) {
      revalidatePath("/admin", "layout");
      return { ok: `Link criado: /${slug}` };
    }
    if (error.code !== UNIQUE_VIOLATION) return { error: `Erro ao salvar: ${error.message}` };
  }
  return { error: parsed.slug ? "Esse código já está em uso. Escolha outro." : "Não foi possível gerar um código. Tente de novo." };
}

export async function updateLink(id: number, _prev: LinkFormState, formData: FormData): Promise<LinkFormState> {
  await requireSession();
  const parsed = parseLinkForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  if (!parsed.slug) return { error: "Informe o código do link." };

  const { error } = await db()
    .from("links")
    .update({ slug: parsed.slug, ...parsed.fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return { error: error.code === UNIQUE_VIOLATION ? "Esse código já está em uso. Escolha outro." : `Erro ao salvar: ${error.message}` };
  }
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/links/${id}`);
  return { ok: "Alterações salvas." };
}

export async function setLinkActive(id: number, active: boolean): Promise<void> {
  await requireSession();
  const { error } = await db().from("links").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/links/${id}`);
}

export async function deleteLink(id: number): Promise<void> {
  await requireSession();
  const { error } = await db().from("links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "layout");
  redirect("/admin/links");
}
