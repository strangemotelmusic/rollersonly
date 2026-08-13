"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const SITE_URL = "https://rollersonly.com";

export async function createDotsBirdCheckout(birdIds: string[]) {
  if (birdIds.length === 0) {
    return { error: "Your cart is empty." };
  }

  const admin = createAdminClient();
  const { data: birds } = await admin
    .from("dots_birds")
    .select("id, name, band_number, price_cents, photo_url, is_available")
    .in("id", birdIds);

  if (!birds || birds.length === 0) {
    return { error: "None of the birds in your cart could be found." };
  }

  const unavailable = birds.filter((b) => !b.is_available);
  if (unavailable.length > 0) {
    return {
      error: `${unavailable.map((b) => b.name).join(", ")} ${unavailable.length === 1 ? "is" : "are"} no longer available.`,
      unavailableIds: unavailable.map((b) => b.id),
    };
  }

  const missingIds = birdIds.filter((id) => !birds.some((b) => b.id === id));
  if (missingIds.length > 0) {
    return { error: "Some birds in your cart no longer exist.", unavailableIds: missingIds };
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: birds.map((bird) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: bird.price_cents,
        product_data: {
          name: bird.name + (bird.band_number ? ` — Band #${bird.band_number}` : ""),
          images: bird.photo_url ? [bird.photo_url] : undefined,
        },
      },
    })),
    success_url: `${SITE_URL}/dots-birds?checkout=success`,
    cancel_url: `${SITE_URL}/cart?checkout=cancelled`,
    metadata: { bird_ids: birds.map((b) => b.id).join(",") },
  });

  if (!session.url) {
    return { error: "Could not start checkout." };
  }

  await admin.from("dots_bird_orders").insert({
    stripe_session_id: session.id,
    bird_ids: birds.map((b) => b.id),
    status: "pending",
  });

  redirect(session.url);
}
