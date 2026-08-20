import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { requireMobileUser } from "@/lib/mobile-auth";

// Mobile equivalent of src/app/actions/bids.ts's placeBid() - same business
// rules, just reachable over HTTP with a Bearer token instead of a Next.js
// Server Action, since React Native can't call Server Actions directly.
export async function POST(request: NextRequest) {
  const gate = await requireMobileUser(request);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await request.json().catch(() => null);
  const auctionId = body?.auctionId;
  const amount = Number(body?.amount);
  if (!auctionId || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "auctionId and amount are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(gate.userId);
  if (!authUser.user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const profile = await ensureProfile(authUser.user);

  if (profile?.tier === "browse") {
    return NextResponse.json({ error: "Browse Only members can't place bids — upgrade your plan to bid." }, { status: 403 });
  }

  const { data: auction, error: auctionErr } = await admin
    .from("auctions")
    .select("id, status, ends_at, current_bid, starting_bid, bid_increment, seller_id")
    .eq("id", auctionId)
    .single();

  if (auctionErr || !auction) {
    return NextResponse.json({ error: "Auction not found." }, { status: 404 });
  }

  if (auction.seller_id === gate.userId) {
    return NextResponse.json({ error: "You cannot bid on your own auction." }, { status: 400 });
  }

  if (auction.status !== "live") {
    return NextResponse.json({ error: "This auction is not currently live." }, { status: 400 });
  }

  if (new Date(auction.ends_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This auction has ended." }, { status: 400 });
  }

  const minBid = Number(auction.current_bid ?? auction.starting_bid) + Number(auction.bid_increment);
  if (amount < minBid) {
    return NextResponse.json({ error: `Minimum bid is $${minBid.toLocaleString()}.` }, { status: 400 });
  }

  const { data: newBid, error: insertErr } = await admin
    .from("bids")
    .insert({ auction_id: auctionId, bidder_id: gate.userId, amount, is_winning: true })
    .select("id")
    .single();

  if (insertErr || !newBid) {
    return NextResponse.json({ error: insertErr?.message || "Could not place bid." }, { status: 500 });
  }

  await admin.from("bids").update({ is_winning: false }).eq("auction_id", auctionId).neq("id", newBid.id);
  await admin.from("auctions").update({ current_bid: amount }).eq("id", auctionId);

  return NextResponse.json({ ok: true, currentBid: amount });
}
