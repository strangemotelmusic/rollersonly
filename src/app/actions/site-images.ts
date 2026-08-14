"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_IMAGE_SLOTS, type SiteImageKey } from "@/lib/site-images";

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

export async function replaceSiteImage(key: SiteImageKey, formData: FormData): Promise<{ error: string } | { ok: true; url: string }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const slot = SITE_IMAGE_SLOTS.find((s) => s.key === key);
  if (!slot) {
    return { error: "Unknown image slot." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file first." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${key}-${Date.now()}.${ext}`;
  const { error: uploadErr } = await admin.storage.from("site-images").upload(path, file);
  if (uploadErr) {
    return { error: `Upload failed: ${uploadErr.message}` };
  }

  const url = admin.storage.from("site-images").getPublicUrl(path).data.publicUrl;

  // Preserve a previously-set custom label instead of always resetting it
  // back to the hardcoded default whenever the photo is replaced.
  const { data: existing } = await admin.from("site_images").select("label").eq("key", key).maybeSingle();
  const label = existing?.label ?? slot.label;

  const { error: dbErr } = await admin
    .from("site_images")
    .upsert({ key, label, url, updated_at: new Date().toISOString() });
  if (dbErr) {
    return { error: `Saved the upload, but failed to update the site: ${dbErr.message}` };
  }

  return { ok: true, url };
}

export async function renameSiteImage(key: SiteImageKey, label: string): Promise<{ error: string } | { ok: true; label: string }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const trimmed = label.trim();
  if (!trimmed) return { error: "Name can't be empty." };

  const slot = SITE_IMAGE_SLOTS.find((s) => s.key === key);
  if (!slot) return { error: "Unknown image slot." };

  // Upsert requires a url too - preserve whatever's currently set (or the
  // slot default if this key has never been overridden before).
  const { data: existing } = await admin.from("site_images").select("url").eq("key", key).maybeSingle();
  const url = existing?.url ?? slot.defaultUrl;

  const { error: dbErr } = await admin
    .from("site_images")
    .upsert({ key, label: trimmed, url, updated_at: new Date().toISOString() });
  if (dbErr) return { error: dbErr.message };

  return { ok: true, label: trimmed };
}
