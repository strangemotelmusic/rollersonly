"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

export async function placeBid(auctionId: string, amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to bid." };
  }

  const admin = createAdminClient();

  const profile = await ensureProfile(user);

  if (profile?.tier === "browse") {
    return { error: "Browse Only members can't place bids — upgrade your plan to bid." };
  }

  const { data: auction, error: auctionErr } = await admin
    .from("auctions")
    .select("id, status, ends_at, current_bid, starting_bid, bid_increment, seller_id")
    .eq("id", auctionId)
    .single();

  if (auctionErr || !auction) {
    return { error: "Auction not found." };
  }

  if (auction.seller_id === user.id) {
    return { error: "You cannot bid on your own auction." };
  }

  if (auction.status !== "live") {
    return { error: "This auction is not currently live." };
  }

  if (new Date(auction.ends_at).getTime() < Date.now()) {
    return { error: "This auction has ended." };
  }

  const minBid = Number(auction.current_bid ?? auction.starting_bid) + Number(auction.bid_increment);
  if (amount < minBid) {
    return { error: `Minimum bid is $${minBid.toLocaleString()}.` };
  }

  const { data: newBid, error: insertErr } = await admin
    .from("bids")
    .insert({ auction_id: auctionId, bidder_id: user.id, amount, is_winning: true })
    .select("id")
    .single();

  if (insertErr || !newBid) {
    return { error: insertErr?.message || "Could not place bid." };
  }

  await admin.from("bids").update({ is_winning: false }).eq("auction_id", auctionId).neq("id", newBid.id);
  await admin.from("auctions").update({ current_bid: amount }).eq("id", auctionId);

  return { success: true, currentBid: amount };
}
