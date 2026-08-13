"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type MagazineIssueUpdate = Database["public"]["Tables"]["magazine_issues"]["Update"];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." } as const;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only." } as const;

  return { admin } as const;
}

export async function createMagazineIssue(formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const issueNumberRaw = String(formData.get("issueNumber") || "");
  const issueNumber = Number(issueNumberRaw);
  const description = String(formData.get("description") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const publishedAt = String(formData.get("publishedAt") || "");

  if (!title) return { error: "Issue title is required." };
  if (!issueNumberRaw || !Number.isInteger(issueNumber) || issueNumber <= 0) {
    return { error: "Enter a valid issue number." };
  }

  let coverImageUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("magazine-covers").upload(path, file);
    if (uploadErr) return { error: `Cover upload failed: ${uploadErr.message}` };
    coverImageUrl = admin.storage.from("magazine-covers").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin.from("magazine_issues").insert({
    title,
    issue_number: issueNumber,
    description: description || null,
    content: content || null,
    cover_image_url: coverImageUrl,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateMagazineIssue(id: string, formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const issueNumberRaw = String(formData.get("issueNumber") || "");
  const issueNumber = Number(issueNumberRaw);
  const description = String(formData.get("description") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const publishedAt = String(formData.get("publishedAt") || "");

  if (!title) return { error: "Issue title is required." };
  if (!issueNumberRaw || !Number.isInteger(issueNumber) || issueNumber <= 0) {
    return { error: "Enter a valid issue number." };
  }

  const update: MagazineIssueUpdate = {
    title,
    issue_number: issueNumber,
    description: description || null,
    content: content || null,
  };
  if (publishedAt) update.published_at = new Date(publishedAt).toISOString();

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("magazine-covers").upload(path, file);
    if (uploadErr) return { error: `Cover upload failed: ${uploadErr.message}` };
    update.cover_image_url = admin.storage.from("magazine-covers").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin.from("magazine_issues").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteMagazineIssue(id: string) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("magazine_issues").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
