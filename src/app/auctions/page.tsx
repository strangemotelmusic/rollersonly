import Nav from "@/components/Nav";
import AuctionsClient from "./AuctionsClient";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AuctionsPage() {
  const admin = createAdminClient();
  const { data: auctionsRaw } = await admin
    .from("auctions")
    .select(
      "id, current_bid, starting_bid, status, ends_at, starts_at, bird_id, birds(id, name, color, primary_photo_url, certification_status, dna_certified, health_certified), lofts(name, location)"
    )
    .in("status", ["live", "scheduled"])
    .order("ends_at", { ascending: true });

  const rows = auctionsRaw ?? [];

  const lots = rows.map((a) => {
    const bird = a.birds;
    const tags = [
      bird?.certification_status === "certified" && "★ Rollers Only Certified",
      bird?.dna_certified && "DNA Cert",
      bird?.health_certified && "Health Cert",
    ].filter(Boolean) as string[];
    return {
      id: bird?.id ?? a.bird_id,
      name: bird?.name || "Unnamed bird",
      loft: a.lofts?.name || "Independent",
      location: a.lofts?.location ?? "",
      bloodline: bird?.color ?? "",
      isLive: a.status === "live",
      bid: `$${Number(a.current_bid ?? a.starting_bid ?? 0).toLocaleString()}`,
      bidLabel: a.status === "live" ? "Current bid" : "Opening bid",
      bids: 0,
      seconds: a.ends_at ? Math.max(0, Math.round((new Date(a.ends_at).getTime() - Date.now()) / 1000)) : 0,
      scheduleLabel: a.status === "scheduled" ? `Starts ${new Date(a.starts_at).toLocaleDateString()}` : "Coming soon",
      imgUrl: bird?.primary_photo_url || "/bird-white-red.jpg",
      tags,
    };
  });

  const locations = Array.from(new Set(lots.map((l) => l.location).filter(Boolean)));
  const bloodlines = Array.from(new Set(lots.map((l) => l.bloodline).filter(Boolean)));

  return (
    <>
      <Nav active="/auctions" />
      <AuctionsClient lots={lots} locations={locations} bloodlines={bloodlines} />
    </>
  );
}
