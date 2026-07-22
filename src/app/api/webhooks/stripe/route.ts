import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe, getPriceIdToTier } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

async function downgradeCustomer(customerId: string) {
  const admin = createAdminClient();
  await admin.from("profiles").update({ tier: "browse" }).eq("stripe_customer_id", customerId);
}

async function syncSubscriptionTier(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (subscription.status === "active" || subscription.status === "trialing") {
    const priceId = subscription.items.data[0]?.price.id;
    const tier = priceId ? getPriceIdToTier()[priceId] : null;
    if (tier) {
      await admin.from("profiles").update({ tier }).eq("stripe_customer_id", customerId);
    }
  } else {
    await downgradeCustomer(customerId);
  }
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
        await syncSubscriptionTier(subscription);
      }
      break;
    }
    case "customer.subscription.updated": {
      await syncSubscriptionTier(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await downgradeCustomer(customerId);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) await downgradeCustomer(customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
