import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, getTierPriceIds } from "@/lib/stripe";

// Mobile equivalent of src/app/actions/stripe.ts's createCheckoutSession -
// same customer-creation/lookup logic, but returns the Checkout Session URL
// as JSON instead of redirect().
export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const tierInput: string | undefined = body?.tier;
  const priceId = tierInput ? getTierPriceIds()[tierInput] : undefined;
  if (!priceId || !tierInput) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", auth.userId).maybeSingle();
  const { data: authUser } = await admin.auth.admin.getUserById(auth.userId);

  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: authUser?.user?.email,
      metadata: { user_id: auth.userId },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", auth.userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: "https://rollersonly.com/dashboard?checkout=success",
    cancel_url: "https://rollersonly.com/dashboard?checkout=cancelled",
    metadata: { user_id: auth.userId, tier: tierInput },
    subscription_data: { metadata: { user_id: auth.userId, tier: tierInput } },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
