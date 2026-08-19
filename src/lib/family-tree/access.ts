import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FamilyTreeProfile = { id: string; tier: string; isAdmin: boolean; hasAddon: boolean };

/**
 * Family Tree is a standalone $40/yr add-on, fully decoupled from the
 * marketplace subscription tier — elite subscribers get it bundled free,
 * everyone else (including fancier/breeder) must buy the add-on separately.
 * All three pages (Registry/Breeding/Performance) share one flat gate; there
 * is no more per-page tier distinction now that pricing isn't tiered.
 * Signed-out or unpaid visitors are sent to the public landing page with an
 * upsell param. Site admins bypass the check entirely.
 */
export async function requireFamilyTreeAccess(): Promise<FamilyTreeProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/family-tree?upgrade=addon");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tier, is_admin, family_tree_addon_active")
    .eq("id", user.id)
    .maybeSingle();

  const tier = profile?.tier ?? "browse";
  const isAdmin = Boolean(profile?.is_admin);
  const hasAddon = Boolean(profile?.family_tree_addon_active);
  const hasAccess = isAdmin || tier === "elite" || hasAddon;

  if (!hasAccess) redirect("/family-tree?upgrade=addon");

  return { id: user.id, tier, isAdmin, hasAddon };
}

export function hasFamilyTreeAccess(profile: { tier: string; is_admin: boolean; family_tree_addon_active: boolean }): boolean {
  return profile.is_admin || profile.tier === "elite" || profile.family_tree_addon_active;
}
