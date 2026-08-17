"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type FutureIssueUpdate = Database["public"]["Tables"]["future_issues"]["Update"];

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

// Accepts a full YouTube URL (watch, youtu.be, embed, shorts, live) or a bare
// 11-char video id, and returns just the id — so pasting any link works.
function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ── FUTURE ISSUES ── */

export async function createFutureIssue(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const releaseLabel = String(formData.get("releaseLabel") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title) return { error: "Issue title is required." };

  let coverUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("future-issue-covers").upload(path, file);
    if (uploadErr) return { error: `Cover upload failed: ${uploadErr.message}` };
    coverUrl = admin.storage.from("future-issue-covers").getPublicUrl(path).data.publicUrl;
  }

  const { data: maxRow } = await admin
    .from("future_issues")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("future_issues").insert({
    title,
    release_label: releaseLabel || null,
    description: description || null,
    cover_url: coverUrl,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateFutureIssue(id: string, formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const releaseLabel = String(formData.get("releaseLabel") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title) return { error: "Issue title is required." };

  const update: FutureIssueUpdate = {
    title,
    release_label: releaseLabel || null,
    description: description || null,
    updated_at: new Date().toISOString(),
  };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("future-issue-covers").upload(path, file);
    if (uploadErr) return { error: `Cover upload failed: ${uploadErr.message}` };
    update.cover_url = admin.storage.from("future-issue-covers").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin.from("future_issues").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteFutureIssue(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("future_issues").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

/* ── FEATURED VIDEOS ── */

export async function addFeaturedVideo(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const link = String(formData.get("link") || "").trim();
  if (!title) return { error: "Give the video a title." };
  if (!link) return { error: "Paste a YouTube link." };

  const youtubeId = parseYouTubeId(link);
  if (!youtubeId) return { error: "That doesn't look like a valid YouTube link." };

  const { data: maxRow } = await admin
    .from("featured_videos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("featured_videos").insert({
    title,
    youtube_id: youtubeId,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function addFeaturedVideosBulk(formData: FormData): Promise<{ error: string } | { ok: true; added: number; skipped: number }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const raw = String(formData.get("links") || "");
  // Accept links separated by newlines, commas, or spaces.
  const candidates = raw.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);
  if (candidates.length === 0) return { error: "Paste at least one YouTube link." };

  const ids: string[] = [];
  let skipped = 0;
  for (const c of candidates) {
    const id = parseYouTubeId(c);
    if (id && !ids.includes(id)) ids.push(id);
    else skipped++;
  }
  if (ids.length === 0) return { error: "None of those looked like valid YouTube links." };

  const [{ data: maxRow }, { count }] = await Promise.all([
    admin.from("featured_videos").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle(),
    admin.from("featured_videos").select("id", { count: "exact", head: true }),
  ]);

  let order = maxRow?.sort_order ?? 0;
  let n = count ?? 0;
  const rows = ids.map((youtube_id) => {
    order += 1;
    n += 1;
    return { title: `Clip ${n}`, youtube_id, sort_order: order };
  });

  const { error } = await admin.from("featured_videos").insert(rows);
  if (error) return { error: error.message };
  return { ok: true, added: ids.length, skipped };
}

export async function updateFeaturedVideoTitle(id: string, title: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const trimmed = title.trim();
  if (!trimmed) return { error: "Name can't be empty." };

  const { error } = await admin.from("featured_videos").update({ title: trimmed, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteFeaturedVideo(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("featured_videos").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

/* ── MEMBER VIDEO SUBMISSIONS ── */

export async function approveVideoSubmission(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const {
    data: { user: adminUser },
  } = await (await createClient()).auth.getUser();

  const { data: submission } = await admin.from("video_submissions").select("id, user_id, title, video_url, status").eq("id", id).maybeSingle();
  if (!submission) return { error: "Submission not found." };
  if (submission.status !== "pending") return { error: "This submission was already reviewed." };

  const { data: maxRow } = await admin
    .from("featured_videos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertErr } = await admin.from("featured_videos").insert({
    title: submission.title,
    source: "upload",
    video_url: submission.video_url,
    submitted_by: submission.user_id,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });
  if (insertErr) return { error: insertErr.message };

  const { error: updateErr } = await admin
    .from("video_submissions")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: adminUser?.id ?? null })
    .eq("id", id);
  if (updateErr) return { error: updateErr.message };

  return { ok: true };
}

export async function rejectVideoSubmission(id: string, note: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const {
    data: { user: adminUser },
  } = await (await createClient()).auth.getUser();

  const { error } = await admin
    .from("video_submissions")
    .update({ status: "rejected", rejection_note: note.trim() || null, reviewed_at: new Date().toISOString(), reviewed_by: adminUser?.id ?? null })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { ok: true };
}
