import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const TIER_PRICE_IDS: Record<string, string> = {
  fancier: process.env.STRIPE_PRICE_FANCIER!,
  breeder: process.env.STRIPE_PRICE_BREEDER!,
  elite: process.env.STRIPE_PRICE_ELITE!,
};

export const PRICE_ID_TO_TIER: Record<string, string> = Object.fromEntries(
  Object.entries(TIER_PRICE_IDS).map(([tier, priceId]) => [priceId, tier])
);
