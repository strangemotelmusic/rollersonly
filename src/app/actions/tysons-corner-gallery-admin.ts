"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const IMAGE_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tysons-corner-gallery/`;

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

// The photo is already uploaded client-side by the time this runs (see
// uploadAdminImage) - only validate the URL points at the right bucket.
export async function addGalleryPhoto(imageUrl: string, caption: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) return { error: "Unexpected photo URL." };

  const { error } = await admin.from("tysons_corner_gallery").insert({
    image_url: imageUrl,
    caption: caption.trim() || null,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteGalleryPhoto(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("tysons_corner_gallery").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
