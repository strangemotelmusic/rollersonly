import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { asPhotoSettingsMap, type PhotoCropSettings } from "@/lib/our-breeders/crop";

type Client = SupabaseClient<Database>;

export type RegisterFamilyTreeBirdInput = {
  ownerId: string;
  name: string;
  ringNumber: string | null;
  sex: string | null;
  color: string | null;
  birthYear: number | null;
  sireId: string | null;
  damId: string | null;
  notes: string | null;
  photos: File[];
};

/** Direct client write against family_tree_birds — fully independent of the marketplace `birds` table. */
export async function registerFamilyTreeBird(
  supabase: Client,
  input: RegisterFamilyTreeBirdInput
): Promise<{ error: string } | { ok: true; birdId: string }> {
  if (!input.name.trim()) return { error: "Bird name is required." };

  const uploadedUrls: string[] = [];
  for (const file of input.photos) {
    const path = `${input.ownerId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("family-tree-photos").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    uploadedUrls.push(supabase.storage.from("family-tree-photos").getPublicUrl(path).data.publicUrl);
  }
  const primaryPhotoUrl = uploadedUrls[0] ?? null;

  const { data: bird, error: birdErr } = await supabase
    .from("family_tree_birds")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      ring_number: input.ringNumber,
      sex: input.sex,
      color: input.color,
      birth_year: input.birthYear,
      sire_id: input.sireId,
      dam_id: input.damId,
      primary_photo_url: primaryPhotoUrl,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (birdErr || !bird) return { error: birdErr?.message || "Could not register bird." };
  return { ok: true, birdId: bird.id };
}

export type UpdateFamilyTreeBirdInput = {
  name: string;
  ringNumber: string | null;
  sex: string | null;
  color: string | null;
  birthYear: number | null;
  sireId: string | null;
  damId: string | null;
  notes: string | null;
};

export async function updateFamilyTreeBird(
  supabase: Client,
  birdId: string,
  input: UpdateFamilyTreeBirdInput
): Promise<{ error: string } | { ok: true }> {
  const { error } = await supabase
    .from("family_tree_birds")
    .update({
      name: input.name,
      ring_number: input.ringNumber,
      sex: input.sex,
      color: input.color,
      birth_year: input.birthYear,
      sire_id: input.sireId,
      dam_id: input.damId,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", birdId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateFamilyTreeBirdPhotoSettings(
  supabase: Client,
  birdId: string,
  url: string,
  settings: PhotoCropSettings
): Promise<{ error: string } | { ok: true }> {
  const { data: existing } = await supabase.from("family_tree_birds").select("photo_settings").eq("id", birdId).maybeSingle();
  if (!existing) return { error: "Bird not found." };

  const photoSettings = { ...asPhotoSettingsMap(existing.photo_settings), [url]: settings };
  const { error } = await supabase
    .from("family_tree_birds")
    .update({ photo_settings: photoSettings as unknown as Json, updated_at: new Date().toISOString() })
    .eq("id", birdId);
  if (error) return { error: error.message };
  return { ok: true };
}
