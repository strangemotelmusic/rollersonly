import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type FlyLogInput = {
  birdId: string;
  ownerId: string;
  loggedAt: string;
  depth: string | null;
  frequency: string | null;
  kitBehavior: string | null;
  notes: string | null;
};

/** Direct client write — fly_log_entries RLS is owner-scoped, same convention as birds/auctions. */
export async function addFlyLogEntry(
  supabase: Client,
  input: FlyLogInput
): Promise<{ error: string } | { ok: true; entryId: string }> {
  const { data, error } = await supabase
    .from("fly_log_entries")
    .insert({
      bird_id: input.birdId,
      owner_id: input.ownerId,
      logged_at: input.loggedAt,
      depth: input.depth,
      frequency: input.frequency,
      kit_behavior: input.kitBehavior,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Could not save fly log entry." };
  return { ok: true, entryId: data.id };
}

export async function deleteFlyLogEntry(supabase: Client, entryId: string): Promise<{ error: string } | { ok: true }> {
  const { error } = await supabase.from("fly_log_entries").delete().eq("id", entryId);
  if (error) return { error: error.message };
  return { ok: true };
}
