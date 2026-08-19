import Stripe from "stripe";

// Lazily constructed - a module-level `new Stripe(...)` executes as soon as
// this file is imported, including during Next's build-time module tracing,
// which can run before the env var is guaranteed to be populated (e.g. not
// yet set in Vercel's project settings). Deferring construction to first
// actual use avoids crashing the build over that.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export function getTierPriceIds(): Record<string, string> {
  return {
    fancier: process.env.STRIPE_PRICE_FANCIER!,
    breeder: process.env.STRIPE_PRICE_BREEDER!,
    elite: process.env.STRIPE_PRICE_ELITE!,
  };
}

export function getPriceIdToTier(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getTierPriceIds()).map(([tier, priceId]) => [priceId, tier])
  );
}

// The Family Tree add-on is a separate, standalone subscription from the
// marketplace tier - a customer can have both at once, each with its own
// Stripe Customer id, so webhook handling must never conflate the two.
export function getFamilyTreeAddonPriceId(): string {
  return process.env.STRIPE_PRICE_FAMILY_TREE_ADDON!;
}

export function isFamilyTreeAddonPrice(priceId: string): boolean {
  return priceId === getFamilyTreeAddonPriceId();
}
