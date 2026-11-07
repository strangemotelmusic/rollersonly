"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const SITE_URL = "https://rollersonly.com";
const DEPOSIT_CENTS = 50000;

export async function createMatchmakingReservation(sireBirdId: string, damBirdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const admin = createAdminClient();
  const { data: birds } = await admin
    .from("birds")
    .select("id, name, sex, owner_id, is_active, available_for_matchmaking")
    .in("id", [sireBirdId, damBirdId]);

  const sire = birds?.find((b) => b.id === sireBirdId);
  const dam = birds?.find((b) => b.id === damBirdId);

  if (!sire || !dam) {
    return { error: "One of the selected birds could no longer be found." };
  }
  if (!sire.available_for_matchmaking || !sire.is_active || sire.sex !== "cock") {
    return { error: `${sire.name ?? "The sire"} is no longer available for matchmaking.` };
  }
  if (!dam.available_for_matchmaking || !dam.is_active || dam.sex !== "hen") {
    return { error: `${dam.name ?? "The dam"} is no longer available for matchmaking.` };
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: DEPOSIT_CENTS,
          product_data: {
            name: `Custom Pairing Deposit — ${sire.name ?? "Sire"} × ${dam.name ?? "Dam"}`,
          },
        },
      },
    ],
    success_url: `${SITE_URL}/matchmaking?checkout=success`,
    cancel_url: `${SITE_URL}/matchmaking?checkout=cancelled`,
    metadata: {
      requester_id: user.id,
      sire_bird_id: sire.id,
      dam_bird_id: dam.id,
      sire_owner_id: sire.owner_id,
      dam_owner_id: dam.owner_id,
    },
  });

  if (!session.url) {
    return { error: "Could not start checkout." };
  }

  await admin.from("matchmaking_reservations").insert({
    requester_id: user.id,
    sire_bird_id: sire.id,
    dam_bird_id: dam.id,
    sire_owner_id: sire.owner_id,
    dam_owner_id: dam.owner_id,
    stripe_session_id: session.id,
    deposit_status: "pending",
    deposit_amount_cents: DEPOSIT_CENTS,
  });

  redirect(session.url);
}
