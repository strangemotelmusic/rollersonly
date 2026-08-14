import Nav from "@/components/Nav";
import AuctionsClient from "./AuctionsClient";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AuctionsPage() {
  const admin = createAdminClient();
  const { data: cards } = await admin
    .from("live_auction_cards")
    .select("id, name, loft_name, location, price_cents, bid_count, status, ends_at, schedule_label, tags, image_url")
    .order("sort_order", { ascending: true });

  const rows = cards ?? [];

  const liveAuctions = rows
    .filter((c) => c.status === "live")
    .map((c) => ({
      id: c.id,
      name: c.name,
      loft: c.loft_name,
      location: c.location,
      bid: `$${(c.price_cents / 100).toLocaleString()}`,
      bids: c.bid_count,
      seconds: c.ends_at ? Math.max(0, Math.round((new Date(c.ends_at).getTime() - Date.now()) / 1000)) : 0,
      imgUrl: c.image_url || "/bird-white-red.jpg",
      tags: c.tags,
    }));

  const upcomingAuctions = rows
    .filter((c) => c.status === "upcoming")
    .map((c) => ({
      id: c.id,
      name: c.name,
      loft: c.loft_name,
      location: c.location,
      startBid: `$${(c.price_cents / 100).toLocaleString()}`,
      date: c.schedule_label || "Coming soon",
      imgUrl: c.image_url || "/bird-white-red.jpg",
      tags: c.tags,
    }));

  const totalBidValueCents = rows.filter((c) => c.status === "live").reduce((sum, c) => sum + c.price_cents, 0);

  return (
    <>
      <Nav active="/auctions" />
      <AuctionsClient liveAuctions={liveAuctions} upcomingAuctions={upcomingAuctions} totalBidValueCents={totalBidValueCents} />
    </>
  );
}
