"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Unlike Site Images / D.O.T.S Birds / Magazine, the file itself is never
// sent through these actions — archive videos can run into the hundreds of
// MB, well past what a server action body can carry. The browser uploads
// directly to the archive-media bucket first (see ArchiveAdminClient), and
// these actions only ever persist the resulting metadata row.

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

export async function createArchiveItem(formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const mediaUrl = String(formData.get("mediaUrl") || "").trim();
  const mediaType = String(formData.get("mediaType") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();

  if (!title) return { error: "Title is required." };
  if (!mediaUrl || (mediaType !== "image" && mediaType !== "video")) {
    return { error: "Upload a photo or video first." };
  }

  const { error } = await admin.from("archive_media").insert({
    title,
    description: description || null,
    media_url: mediaUrl,
    media_type: mediaType,
    thumbnail_url: thumbnailUrl || null,
  });

  if (error) return { error: error.message };
  return { ok: true } as const;
}

export async function updateArchiveItem(id: string, formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) return { error: "Title is required." };

  const { error } = await admin
    .from("archive_media")
    .update({ title, description: description || null })
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true } as const;
}

export async function deleteArchiveItem(id: string) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("archive_media").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true } as const;
}
