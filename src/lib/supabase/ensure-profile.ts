import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";

// Auth users don't always have a matching profiles row yet (e.g. they
// confirmed email but never visited a page that happened to create one).
// Anything that inserts a row referencing profiles(id) as a FK - birds,
// auctions, bids, lofts - needs this to exist first or the insert fails
// with a foreign key violation. Uses the admin client so it works
// regardless of RLS/session timing.
export async function ensureProfile(user: User) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id, username, full_name, tier")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: created } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      username: user.user_metadata?.username || user.email!.split("@")[0],
      full_name: user.user_metadata?.full_name,
      tier: user.user_metadata?.tier || "fancier",
    })
    .select("id, username, full_name, tier")
    .maybeSingle();

  return created;
}
