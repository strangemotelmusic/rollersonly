import AuctionRoom from "./AuctionRoom";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

export default async function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await ensureProfile(user) : null;

  const { data: auction } = await supabase
    .from("auctions")
    .select(
      `id, title, description, reserve_price, starting_bid, current_bid, bid_increment, ends_at, status, video_url, seller_id,
       birds(id, name, ring_number, color, sex, birth_year, primary_photo_url, roll_quality, health_certified, dna_certified, lofts(name, location)),
       bids(id, amount, bidder_id, created_at, profiles(username))`
    )
    .eq("id", id)
    .maybeSingle();

  if (!auction) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Auction not found.
      </div>
    );
  }

  const secondsLeft = Math.max(0, Math.floor((new Date(auction.ends_at).getTime() - Date.now()) / 1000));

  return (
    <AuctionRoom
      auction={auction}
      secondsLeft={secondsLeft}
      currentUserId={user?.id ?? null}
      isBrowseOnly={profile?.tier === "browse"}
    />
  );
}
