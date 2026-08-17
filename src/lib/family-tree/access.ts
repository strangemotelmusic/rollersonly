import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FamilyTreeTier = "fancier" | "breeder" | "elite";

const TIER_RANK: Record<string, number> = { browse: 0, fancier: 1, breeder: 2, elite: 3 };

export type FamilyTreeProfile = { id: string; tier: string };

/**
 * Gates a Family Tree page by the existing profiles.tier — no new billing,
 * per the product decision to reuse the marketplace subscription tiers.
 * fancier -> Registry, breeder -> +Breeding, elite -> +Performance.
 * Under-tier or signed-out visitors are sent to the public Family Tree
 * landing page with an upsell query param naming the tier they need.
 */
export async function requireFamilyTreeTier(minTier: FamilyTreeTier): Promise<FamilyTreeProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/family-tree?upgrade=${minTier}`);

  const { data: profile } = await supabase.from("profiles").select("id, tier").eq("id", user.id).maybeSingle();
  const tier = profile?.tier ?? "browse";

  if ((TIER_RANK[tier] ?? 0) < TIER_RANK[minTier]) {
    redirect(`/family-tree?upgrade=${minTier}`);
  }

  return { id: user.id, tier };
}

export function tierRank(tier: string): number {
  return TIER_RANK[tier] ?? 0;
}
