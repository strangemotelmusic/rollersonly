import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: toStart } = await admin
    .from("auctions")
    .update({ status: "live" })
    .eq("status", "scheduled")
    .lte("starts_at", now)
    .select("id");

  const { data: toEnd } = await admin
    .from("auctions")
    .select("id")
    .eq("status", "live")
    .lte("ends_at", now);

  let settled = 0;
  for (const auction of toEnd ?? []) {
    const { data: winningBid } = await admin
      .from("bids")
      .select("bidder_id, amount")
      .eq("auction_id", auction.id)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle();

    await admin
      .from("auctions")
      .update({
        status: "ended",
        winner_id: winningBid?.bidder_id ?? null,
        final_price: winningBid?.amount ?? null,
      })
      .eq("id", auction.id);

    settled++;
  }

  return NextResponse.json({
    startedCount: toStart?.length ?? 0,
    endedCount: settled,
  });
}
