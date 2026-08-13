"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_IMAGE_SLOTS, type SiteImageKey } from "@/lib/site-images";

export async function replaceSiteImage(key: SiteImageKey, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) {
    return { error: "Admins only." };
  }

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

  const { error: dbErr } = await admin
    .from("site_images")
    .upsert({ key, label: slot.label, url, updated_at: new Date().toISOString() });
  if (dbErr) {
    return { error: `Saved the upload, but failed to update the site: ${dbErr.message}` };
  }

  return { ok: true, url };
}
