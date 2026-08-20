import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Mobile equivalent of src/app/actions/dots-birds-checkout.ts - identical
// validation/order-row logic, but returns the Checkout Session URL as JSON
// instead of redirect()-ing (a Server Action's mechanism). success_url and
// cancel_url intentionally stay real HTTPS pages, not a rollersonly://
// scheme - Stripe's Checkout API does not reliably accept custom URL
// schemes there. The RN app opens this URL in a plain in-app browser
// (expo-web-browser) and the user taps the browser's own "Done" button to
// return; the app then refetches cart/order state, which is already
// correct at that point regardless, since the Stripe webhook (unchanged,
// src/app/api/webhooks/stripe/route.ts) is the actual source of truth for
// whether the order succeeded.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const birdIds: string[] = Array.isArray(body?.birdIds) ? body.birdIds : [];

  if (birdIds.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: birds } = await admin
    .from("dots_birds")
    .select("id, name, band_number, price_cents, photo_url, is_available")
    .in("id", birdIds);

  if (!birds || birds.length === 0) {
    return NextResponse.json({ error: "None of the birds in your cart could be found." }, { status: 404 });
  }

  const unavailable = birds.filter((b) => !b.is_available);
  if (unavailable.length > 0) {
    return NextResponse.json(
      {
        error: `${unavailable.map((b) => b.name).join(", ")} ${unavailable.length === 1 ? "is" : "are"} no longer available.`,
        unavailableIds: unavailable.map((b) => b.id),
      },
      { status: 409 }
    );
  }

  const missingIds = birdIds.filter((id) => !birds.some((b) => b.id === id));
  if (missingIds.length > 0) {
    return NextResponse.json({ error: "Some birds in your cart no longer exist.", unavailableIds: missingIds }, { status: 409 });
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
    success_url: "https://rollersonly.com/dots-birds?checkout=success",
    cancel_url: "https://rollersonly.com/cart?checkout=cancelled",
    metadata: { bird_ids: birds.map((b) => b.id).join(",") },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  await admin.from("dots_bird_orders").insert({
    stripe_session_id: session.id,
    bird_ids: birds.map((b) => b.id),
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
