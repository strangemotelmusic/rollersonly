import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type CreateSeasonInput = {
  ownerId: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

/** Direct client write — family_tree_seasons RLS is owner-scoped (auth.uid() = owner_id). */
export async function createSeason(
  supabase: Client,
  input: CreateSeasonInput
): Promise<{ error: string } | { ok: true; seasonId: string }> {
  if (!input.label.trim()) return { error: "Season label is required." };

  const { data, error } = await supabase
    .from("family_tree_seasons")
    .insert({
      owner_id: input.ownerId,
      label: input.label.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Could not create season." };
  return { ok: true, seasonId: data.id };
}

export type CreatePairInput = {
  seasonId: string;
  ownerId: string;
  sireId: string;
  damId: string;
  pairedAt: string | null;
  notes: string | null;
};

export async function createBreedingPair(
  supabase: Client,
  input: CreatePairInput
): Promise<{ error: string } | { ok: true; pairId: string }> {
  if (input.sireId === input.damId) return { error: "Sire and dam must be different birds." };

  const { data, error } = await supabase
    .from("family_tree_pairs")
    .insert({
      season_id: input.seasonId,
      owner_id: input.ownerId,
      sire_id: input.sireId,
      dam_id: input.damId,
      paired_at: input.pairedAt,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Could not create breeding pair." };
  return { ok: true, pairId: data.id };
}

export async function updatePairStats(
  supabase: Client,
  pairId: string,
  updates: { eggCount?: number; hatchedCount?: number; status?: "active" | "split" | "retired"; notes?: string | null }
): Promise<{ error: string } | { ok: true }> {
  const { error } = await supabase
    .from("family_tree_pairs")
    .update({
      ...(updates.eggCount !== undefined ? { egg_count: updates.eggCount } : {}),
      ...(updates.hatchedCount !== undefined ? { hatched_count: updates.hatchedCount } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    })
    .eq("id", pairId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteBreedingPair(supabase: Client, pairId: string): Promise<{ error: string } | { ok: true }> {
  const { error } = await supabase.from("family_tree_pairs").delete().eq("id", pairId);
  if (error) return { error: error.message };
  return { ok: true };
}
