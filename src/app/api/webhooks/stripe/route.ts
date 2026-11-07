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

async function notifyMatchmakingParties(params: {
  requesterEmail: string | null;
  sireOwnerId: string;
  damOwnerId: string;
  sireName: string;
  damName: string;
}) {
  if (!process.env.RESEND_API_KEY) return; // not set up yet - skip silently, same as pedigree.ts

  const admin = createAdminClient();
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const breederIds = Array.from(new Set([params.sireOwnerId, params.damOwnerId]));
  const breederEmails = (
    await Promise.all(
      breederIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        return data.user?.email ?? null;
      })
    )
  ).filter((email): email is string => Boolean(email));

  if (breederEmails.length > 0) {
    await resend.emails.send({
      from: "RollersOnly Matchmaking <matchmaking@rollersonly.com>",
      to: breederEmails,
      subject: `New pairing request — ${params.sireName} × ${params.damName}`,
      html: `
        <div style="font-family: Georgia, serif; background:#000; color:#fff; padding:32px;">
          <p style="color:#D4AF37; letter-spacing:0.15em; text-transform:uppercase; font-size:11px;">RollersOnly Matchmaking</p>
          <h1 style="font-weight:300; font-size:24px;">A $500 deposit has been paid</h1>
          <p style="color:#ccc; font-size:14px; line-height:1.6;">
            A member has reserved a pairing between <strong>${params.sireName}</strong> (sire) and
            <strong>${params.damName}</strong> (dam) and paid the $500 deposit. Reach out to them at
            ${params.requesterEmail ?? "the email on file"} to confirm timing and availability.
          </p>
        </div>
      `,
    });
  }

  if (params.requesterEmail) {
    await resend.emails.send({
      from: "RollersOnly Matchmaking <matchmaking@rollersonly.com>",
      to: [params.requesterEmail],
      subject: "Your pairing deposit is confirmed",
      html: `
        <div style="font-family: Georgia, serif; background:#000; color:#fff; padding:32px;">
          <p style="color:#D4AF37; letter-spacing:0.15em; text-transform:uppercase; font-size:11px;">RollersOnly Matchmaking</p>
          <h1 style="font-weight:300; font-size:24px;">Pairing reserved</h1>
          <p style="color:#ccc; font-size:14px; line-height:1.6;">
            Your $500 deposit for <strong>${params.sireName}</strong> × <strong>${params.damName}</strong> is
            confirmed. The breeder has been notified and will reach out directly to confirm timing and
            availability. The remaining $500 balance is due once your bird is bred and ready.
          </p>
        </div>
      `,
    });
  }
}

async function fulfillAuctionPayment(session: Stripe.Checkout.Session) {
  const auctionId = session.metadata?.auction_id;
  if (!auctionId) return;

  const admin = createAdminClient();
  await admin.from("auctions").update({ escrow_held: true }).eq("id", auctionId);
}

async function fulfillMatchmakingReservation(session: Stripe.Checkout.Session) {
  const sireBirdId = session.metadata?.sire_bird_id;
  const damBirdId = session.metadata?.dam_bird_id;
  const sireOwnerId = session.metadata?.sire_owner_id;
  const damOwnerId = session.metadata?.dam_owner_id;
  if (!sireBirdId || !damBirdId || !sireOwnerId || !damOwnerId) return;

  const admin = createAdminClient();
  const customerEmail = session.customer_details?.email ?? null;

  await admin
    .from("matchmaking_reservations")
    .update({ deposit_status: "paid", customer_email: customerEmail })
    .eq("stripe_session_id", session.id);

  const { data: birds } = await admin.from("birds").select("id, name").in("id", [sireBirdId, damBirdId]);
  const sireName = birds?.find((b) => b.id === sireBirdId)?.name ?? "the sire";
  const damName = birds?.find((b) => b.id === damBirdId)?.name ?? "the dam";

  await notifyMatchmakingParties({
    requesterEmail: customerEmail,
    sireOwnerId,
    damOwnerId,
    sireName,
    damName,
  });
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
      } else if (session.payment_status === "paid" && session.mode === "payment" && session.metadata?.sire_bird_id) {
        await fulfillMatchmakingReservation(session);
      } else if (session.payment_status === "paid" && session.mode === "payment" && session.metadata?.type === "auction_payment") {
        await fulfillAuctionPayment(session);
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
