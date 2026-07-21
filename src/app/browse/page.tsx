import Nav from "@/components/Nav";
import BrowseClient from "./BrowseClient";
import { createClient } from "@/lib/supabase/server";

export default async function BrowsePage() {
  const supabase = await createClient();

  const { data: birdsRaw } = await supabase
    .from("birds")
    .select(
      "id, name, primary_photo_url, health_certified, dna_certified, lofts(name, location), auctions(id, current_bid, starting_bid, status, created_at)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const birds = (birdsRaw ?? []).map((b) => {
    const latestAuction = [...(b.auctions ?? [])].sort(
      (x, y) => new Date(y.created_at ?? 0).getTime() - new Date(x.created_at ?? 0).getTime()
    )[0];
    const status = latestAuction?.status === "live" ? "live" : latestAuction?.status === "scheduled" ? "upcoming" : "available";
    const bidAmount = latestAuction?.current_bid ?? latestAuction?.starting_bid ?? null;
    const tags = [
      b.dna_certified && "DNA Cert",
      b.health_certified && "Health Cert",
    ].filter(Boolean) as string[];

    return {
      id: b.id,
      name: b.name || "Unnamed bird",
      loft: b.lofts?.name || "Independent",
      location: b.lofts?.location || "",
      bid: bidAmount ? `$${Number(bidAmount).toLocaleString()}` : "No bids yet",
      status,
      img: b.primary_photo_url,
      tags,
    };
  });

  return (
    <>
      <Nav active="/browse" />
      <BrowseClient birds={birds} />
    </>
  );
}
