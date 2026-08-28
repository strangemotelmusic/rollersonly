"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type MagazineIssueUpdate = Database["public"]["Tables"]["magazine_issues"]["Update"];

const PDF_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/magazine-pdfs/`;

// The PDF is already uploaded client-side by the time this runs (bypasses
// the server action body-size cap - see MagazineAdminClient.tsx) - only
// validate the URL points at the right bucket rather than accepting an
// arbitrary string.
function parsePdfUrl(formData: FormData): { error: string } | { url: string | null } {
  const raw = String(formData.get("pdfUrl") || "").trim();
  if (!raw) return { url: null };
  if (!raw.startsWith(PDF_URL_PREFIX)) return { error: "Unexpected PDF URL." };
  return { url: raw };
}

async function requireAdmin(): Promise<{ error: string } | { admin: ReturnType<typeof createAdminClient> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only." };

  return { admin };
}

export async function createMagazineIssue(formData: FormData): Promise<{ error: string } | { ok: true }> {
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

  const parsedPdf = parsePdfUrl(formData);
  if ("error" in parsedPdf) return parsedPdf;

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
    pdf_url: parsedPdf.url,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateMagazineIssue(id: string, formData: FormData): Promise<{ error: string } | { ok: true }> {
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

  const parsedPdf = parsePdfUrl(formData);
  if ("error" in parsedPdf) return parsedPdf;

  const update: MagazineIssueUpdate = {
    title,
    issue_number: issueNumber,
    description: description || null,
    content: content || null,
  };
  if (publishedAt) update.published_at = new Date(publishedAt).toISOString();
  if (parsedPdf.url) update.pdf_url = parsedPdf.url;

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

export async function deleteMagazineIssue(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("magazine_issues").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
