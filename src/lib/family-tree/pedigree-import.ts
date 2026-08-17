import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ImportNode } from "@/app/actions/pedigree-import";

type Client = SupabaseClient<Database>;

async function createNode(supabase: Client, ownerId: string, node: ImportNode | null): Promise<string | null> {
  if (!node) return null;
  const name = node.name?.trim() || null;
  const ringNumber = node.ringNumber?.trim() || null;
  if (!name && !ringNumber) return null;

  const sireId = await createNode(supabase, ownerId, node.sire);
  const damId = await createNode(supabase, ownerId, node.dam);

  if (ringNumber) {
    const { data: existing } = await supabase
      .from("family_tree_birds")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("ring_number", ringNumber)
      .maybeSingle();
    if (existing) return existing.id;
  }

  const { data, error } = await supabase
    .from("family_tree_birds")
    .insert({
      owner_id: ownerId,
      name,
      ring_number: ringNumber,
      sex: node.sex,
      color: node.color?.trim() || null,
      sire_id: sireId,
      dam_id: damId,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not create a bird from the import.");
  return data.id;
}

export async function createPedigreeFromImport(
  supabase: Client,
  ownerId: string,
  root: ImportNode
): Promise<{ error: string } | { ok: true; birdId: string }> {
  if (!root.name?.trim() && !root.ringNumber?.trim()) {
    return { error: "The main bird needs at least a name or ring number before saving." };
  }
  try {
    const id = await createNode(supabase, ownerId, root);
    if (!id) return { error: "Nothing to create." };
    return { ok: true, birdId: id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the pedigree." };
  }
}
