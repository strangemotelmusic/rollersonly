"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { MAGAZINE_EDITIONS, type MagazineEdition } from "@/lib/magazine-editions";

const SITE_URL = "https://rollersonly.com";
const MAX_QUANTITY = 10;

export async function createMagazineCheckout(edition: MagazineEdition, quantity: number) {
  const product = Object.hasOwn(MAGAZINE_EDITIONS, edition) ? MAGAZINE_EDITIONS[edition] : null;
  if (!product) return { error: "Pick an edition." };
  const qty = Math.min(Math.max(Math.floor(quantity) || 1, 1), MAX_QUANTITY);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount: product.priceCents,
          product_data: {
            name: `Decade of the Spinner — Vol. 1, Issue 1 (${product.label})`,
            description: "Limited-edition print issue. Shipping included. Ships Spring 2027.",
            images: [`${SITE_URL}/decade-of-the-spinner/cover.jpg`],
          },
        },
      },
    ],
    shipping_address_collection: { allowed_countries: ["US"] },
    phone_number_collection: { enabled: true },
    success_url: `${SITE_URL}/decade-of-the-spinner?checkout=success#subscribe`,
    cancel_url: `${SITE_URL}/decade-of-the-spinner?checkout=cancelled#subscribe`,
    metadata: { type: "magazine_order", issue: "vol1-issue1", edition, quantity: String(qty) },
  });

  if (!session.url) return { error: "Could not start checkout. Please try again." };
  redirect(session.url);
}
