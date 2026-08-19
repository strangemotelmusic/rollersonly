import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe, getPriceIdToTier, isFamilyTreeAddonPrice } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

async function fulfillDotsBirdOrder(session: Stripe.Checkout.Session) {
  const admin = createAdminClient();
  const birdIds = session.metadata?.bird_ids?.split(",").filter(Boolean) ?? [];
  if (birdIds.length === 0) return;

  await admin.from("dots_birds").update({ is_available: false }).in("id", birdIds);
  await admin
    .from("dots_bird_orders")
    .update({
      status: "paid",
      customer_email: session.customer_details?.email ?? null,
      amount_total_cents: session.amount_total,
    })
    .eq("stripe_session_id", session.id);
}

// The marketplace tier subscription and the Family Tree add-on subscription
// are two independent Stripe Customers (a Payment Link always creates its
// own Customer, separate from profiles.stripe_customer_id). Each sync path
// below only ever touches its own column, keyed by its own customer id
// column, so a lifecycle event on one product can never affect the other.
async function syncTierSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? getPriceIdToTier()[priceId] : null;
  if (!tier) return; // not a marketplace-tier price - ignore (e.g. it's the add-on)

  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const active = subscription.status === "active" || subscription.status === "trialing";
  await admin.from("profiles").update({ tier: active ? tier : "browse" }).eq("stripe_customer_id", customerId);
}

async function syncFamilyTreeAddonSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId || !isFamilyTreeAddonPrice(priceId)) return; // not the add-on price - ignore

  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const active = subscription.status === "active" || subscription.status === "trialing";
  await admin.from("profiles").update({ family_tree_addon_active: active }).eq("family_tree_addon_customer_id", customerId);
}

async function claimFamilyTreeAddonCustomer(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId) return; // shouldn't happen - the UI always appends it before sending anyone to the Payment Link

  const admin = createAdminClient();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return;

  await admin.from("profiles").update({ family_tree_addon_customer_id: customerId, family_tree_addon_active: true }).eq("id", userId);
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" && session.subscription) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        if (priceId && isFamilyTreeAddonPrice(priceId)) {
          // First-time purchase via the Payment Link - this Stripe Customer
          // is brand new, so there's nothing in family_tree_addon_customer_id
          // to match yet. client_reference_id (set by the app before sending
          // anyone to the link) is how we know which profile just paid.
          await claimFamilyTreeAddonCustomer(session);
        } else {
          await syncTierSubscription(subscription);
        }
      } else if (session.payment_status === "paid" && session.mode === "payment" && session.metadata?.bird_ids) {
        await fulfillDotsBirdOrder(session);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncTierSubscription(subscription);
      await syncFamilyTreeAddonSubscription(subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const admin = createAdminClient();
        await admin.from("profiles").update({ tier: "browse" }).eq("stripe_customer_id", customerId);
        await admin.from("profiles").update({ family_tree_addon_active: false }).eq("family_tree_addon_customer_id", customerId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
