import type { createAdminClient } from "@/lib/supabase/admin";

// Comp accounts get a subscription tier for free, applied automatically the
// moment they sign in - no Stripe purchase required. Managed entirely in the
// vip_comp_tiers table (not source code - these are real people's email
// addresses and this repo is public). Add/remove rows directly in Supabase.
// ensureProfile() re-applies this on every sign-in, so it also survives a
// Stripe webhook ever pushing a real (lapsed) subscription tier back down.

const TIER_RANK: Record<string, number> = { browse: 0, fancier: 1, breeder: 2, elite: 3 };

export async function vipTierFor(
  admin: ReturnType<typeof createAdminClient>,
  email: string | null | undefined
): Promise<"fancier" | "breeder" | "elite" | null> {
  if (!email) return null;
  const { data } = await admin.from("vip_comp_tiers").select("tier").eq("email", email.toLowerCase()).maybeSingle();
  const tier = data?.tier;
  if (tier === "fancier" || tier === "breeder" || tier === "elite") return tier;
  return null;
}

export function tierRank(tier: string): number {
  return TIER_RANK[tier] ?? 0;
}
