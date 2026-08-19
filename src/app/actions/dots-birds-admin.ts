"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type DotsBirdUpdate = Database["public"]["Tables"]["dots_birds"]["Update"];

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dots-birds/`;

// The photo itself is already uploaded client-side by the time this runs
// (see src/lib/admin-uploads.ts) - only validate the URL points at the
// right bucket rather than accepting an arbitrary string.
function parsePhotoUrl(formData: FormData): { error: string } | { url: string | null } {
  const raw = String(formData.get("photoUrl") || "").trim();
  if (!raw) return { url: null };
  if (!raw.startsWith(PHOTO_URL_PREFIX)) return { error: "Unexpected photo URL." };
  return { url: raw };
}

// Explicit return-type annotation is required for `"error" in gate` to
// narrow correctly downstream — see the matching note in src/app/actions/chat.ts.
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

export async function createDotsBird(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const name = String(formData.get("name") || "").trim();
  const bandNumber = String(formData.get("bandNumber") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceRaw = String(formData.get("price") || "");
  const price = Number(priceRaw);

  if (!name) return { error: "Bird name is required." };
  if (!priceRaw || !Number.isFinite(price) || price <= 0) return { error: "Enter a valid price." };

  const parsedPhoto = parsePhotoUrl(formData);
  if ("error" in parsedPhoto) return parsedPhoto;
  const photoUrl = parsedPhoto.url;

  const { error } = await admin.from("dots_birds").insert({
    name,
    band_number: bandNumber || null,
    age: age || null,
    description: description || null,
    price_cents: Math.round(price * 100),
    photo_url: photoUrl,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateDotsBird(id: string, formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const name = String(formData.get("name") || "").trim();
  const bandNumber = String(formData.get("bandNumber") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceRaw = String(formData.get("price") || "");
  const price = Number(priceRaw);

  if (!name) return { error: "Bird name is required." };
  if (!priceRaw || !Number.isFinite(price) || price <= 0) return { error: "Enter a valid price." };

  const update: DotsBirdUpdate = {
    name,
    band_number: bandNumber || null,
    age: age || null,
    description: description || null,
    price_cents: Math.round(price * 100),
    updated_at: new Date().toISOString(),
  };

  const parsedPhoto = parsePhotoUrl(formData);
  if ("error" in parsedPhoto) return parsedPhoto;
  if (parsedPhoto.url) update.photo_url = parsedPhoto.url;

  const { error } = await admin.from("dots_birds").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function setDotsBirdAvailability(id: string, isAvailable: boolean): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin
    .from("dots_birds")
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteDotsBird(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("dots_birds").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
