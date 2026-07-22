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

  const baseUsername = user.user_metadata?.username || user.email!.split("@")[0];
  const fullName = user.user_metadata?.full_name;
  const tier = user.user_metadata?.tier || "fancier";

  const { data: created, error } = await admin
    .from("profiles")
    .upsert({ id: user.id, username: baseUsername, full_name: fullName, tier })
    .select("id, username, full_name, tier")
    .maybeSingle();

  if (!error) return created;

  // Username collision (or any other transient failure) - retry once with a
  // guaranteed-unique username derived from the user's id rather than
  // leaving them with no profile row at all, which breaks every insert that
  // references profiles(id) as a FK (birds, auctions, bids, lofts).
  const { data: retried } = await admin
    .from("profiles")
    .upsert({ id: user.id, username: `${baseUsername}_${user.id.slice(0, 6)}`, full_name: fullName, tier })
    .select("id, username, full_name, tier")
    .maybeSingle();

  return retried;
}
