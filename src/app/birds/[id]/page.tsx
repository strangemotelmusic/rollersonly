import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import BirdBidBox from "./BirdBidBox";
import BirdGallery from "./BirdGallery";

export default async function BirdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await ensureProfile(user) : null;

  const { data: bird } = await supabase
    .from("birds")
    .select(
      `id, name, ring_number, sex, color, birth_year, roll_quality, fly_score, kit_score,
       health_certified, dna_certified, certification_status, notes, primary_photo_url, loft_id, owner_id,
       lofts(name, location, slug, rating, total_birds_sold),
       profiles!birds_owner_id_fkey(username, full_name, tier),
       bird_photos(url, is_primary, sort_order),
       auctions(id, current_bid, starting_bid, bid_increment, status, ends_at, seller_id,
         bids(id, amount, created_at, profiles(username)))`
    )
    .eq("id", id)
    .maybeSingle();

  if (!bird) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Bird not found.
      </div>
    );
  }

  const auction = [...(bird.auctions ?? [])].sort((a, b) => (a.status === "live" ? -1 : 1))[0] ?? null;
  const bids = auction ? [...auction.bids].sort((a, b) => Number(b.amount) - Number(a.amount)) : [];

  const photos = bird.bird_photos && bird.bird_photos.length > 0
    ? [...bird.bird_photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((p) => p.url)
    : bird.primary_photo_url
      ? [bird.primary_photo_url]
      : [];

  let relatedBirds: { id: string; name: string | null; primary_photo_url: string | null }[] = [];
  if (bird.loft_id) {
    const { data } = await supabase
      .from("birds")
      .select("id, name, primary_photo_url")
      .eq("loft_id", bird.loft_id)
      .neq("id", bird.id)
      .eq("is_active", true)
      .limit(3);
    relatedBirds = data ?? [];
  }

  const stats = [
    bird.kit_score != null && { label: "Kit Score", val: `${bird.kit_score} / 100` },
    bird.fly_score != null && { label: "Fly Score", val: `${bird.fly_score} / 100` },
    bird.roll_quality && { label: "Roll Quality", val: bird.roll_quality },
  ].filter((s): s is { label: string; val: string } => Boolean(s));

  return (
    <>
      <Nav active="/browse" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        <div style={{ background: "var(--surface)", borderBottom: "0.5px solid var(--border)", padding: "12px 48px", fontSize: 12, color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link href="/browse" style={{ color: "var(--muted)", textDecoration: "none" }}>Browse Birds</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "var(--white)" }}>{bird.name || "Unnamed bird"}</span>
        </div>

        <div className="rs-2col-a rs-pad-lg" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 0, maxWidth: 1400, margin: "0 auto", padding: "48px 48px 80px" }}>

          <div style={{ paddingRight: 48 }}>
            <BirdGallery
              photos={photos}
              alt={bird.name || "Bird"}
              isLive={auction?.status === "live"}
              dnaCertified={Boolean(bird.dna_certified)}
              healthCertified={Boolean(bird.health_certified)}
              rollersOnlyCertified={bird.certification_status === "certified"}
            />

            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
                {[bird.color, bird.sex].filter(Boolean).join(" · ")}
              </p>
              <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 42, fontWeight: 300, color: "var(--white)", marginBottom: 8, lineHeight: 1.1 }}>{bird.name || "Unnamed bird"}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  {bird.lofts ? (
                    <Link href={`/loft/${bird.lofts.slug}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{bird.lofts.name}</Link>
                  ) : (
                    "Independent seller"
                  )}
                  {bird.lofts?.location ? ` · ${bird.lofts.location}` : ""}
                </span>
                {bird.ring_number && <span style={{ fontSize: 12, color: "var(--muted)", border: "0.5px solid var(--border)", padding: "3px 10px", borderRadius: 1 }}>Ring: {bird.ring_number}</span>}
              </div>
              {bird.notes && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75, maxWidth: 620 }}>{bird.notes}</p>}
            </div>

            {stats.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 20 }}>Performance Profile</div>
                <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 1, background: "var(--border)", border: "0.5px solid var(--border)" }}>
                  {stats.map(({ label, val }) => (
                    <div key={label} style={{ background: "var(--surface)", padding: "20px 24px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedBirds.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 20 }}>More From This Loft</div>
                <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)" }}>
                  {relatedBirds.map((b) => (
                    <Link key={b.id} href={`/birds/${b.id}`} style={{ background: "var(--surface)", display: "block", textDecoration: "none" }}>
                      <div style={{ position: "relative", height: 160, background: "#000" }}>
                        {b.primary_photo_url && <Image src={b.primary_photo_url} alt={b.name || "Bird"} fill style={{ objectFit: "contain", objectPosition: "center bottom" }} />}
                      </div>
                      <div style={{ padding: "14px 16px", borderTop: "0.5px solid var(--border)" }}>
                        <div style={{ fontSize: 13, color: "var(--white)" }}>{b.name || "Unnamed bird"}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: "sticky", top: 88, height: "fit-content" }}>
            <BirdBidBox
              auction={auction}
              bids={bids}
              currentUserId={user?.id ?? null}
              isBrowseOnly={profile?.tier === "browse"}
            />

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>Seller</div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--void)", border: "1px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--gold)" }}>
                  {(bird.profiles?.full_name || bird.profiles?.username || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{bird.profiles?.full_name || bird.profiles?.username || "Unknown seller"}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{bird.lofts?.name || "Independent"}{bird.lofts?.location ? ` · ${bird.lofts.location}` : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, borderTop: "0.5px solid var(--border)", paddingTop: 14 }}>
                <div><div style={{ fontFamily: "var(--ff-display)", fontSize: 20 }}>{bird.lofts?.total_birds_sold ?? 0}</div><div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sales</div></div>
                <div><div style={{ fontFamily: "var(--ff-display)", fontSize: 20 }}>{bird.lofts?.rating ? `${Number(bird.lofts.rating).toFixed(1)}★` : "—"}</div><div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Rating</div></div>
              </div>
              {bird.lofts && (
                <Link href={`/loft/${bird.lofts.slug}`} style={{ display: "block", marginTop: 14, padding: "10px", textAlign: "center", border: "0.5px solid var(--border)", color: "var(--muted)", fontSize: 11, borderRadius: 1, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>View Loft Profile →</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
