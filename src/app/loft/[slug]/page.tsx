import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function LoftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: loft } = await supabase
    .from("lofts")
    .select(
      `id, name, location, country, description, logo_url, is_elite, total_birds_sold, total_championships, rating, created_at,
       profiles(username, full_name)`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!loft) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Loft not found.
      </div>
    );
  }

  const { data: activeBirdsRaw } = await supabase
    .from("birds")
    .select("id, name, primary_photo_url, auctions(current_bid, starting_bid, status, created_at)")
    .eq("loft_id", loft.id)
    .eq("is_active", true);

  const activeBirds = (activeBirdsRaw ?? []).map((b) => {
    const latestAuction = [...(b.auctions ?? [])].sort(
      (x, y) => new Date(y.created_at ?? 0).getTime() - new Date(x.created_at ?? 0).getTime()
    )[0];
    return {
      id: b.id,
      name: b.name || "Unnamed bird",
      img: b.primary_photo_url,
      status: latestAuction?.status === "live" ? "live" : latestAuction?.status === "scheduled" ? "upcoming" : "available",
      bid: latestAuction?.current_bid ?? latestAuction?.starting_bid ?? null,
    };
  });

  const { data: achievements } = await supabase
    .from("leaderboard_entries")
    .select("placement, score, kit_size, competitions(name, organization, competition_date)")
    .eq("loft_id", loft.id)
    .order("id", { ascending: false })
    .limit(6);

  const { data: reviewsRaw } = await supabase
    .from("loft_reviews")
    .select("rating, body, created_at, profiles(username, avatar_url)")
    .eq("loft_id", loft.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const avgRating = loft.rating ? Number(loft.rating).toFixed(1) : "—";
  const memberSince = new Date(loft.created_at ?? Date.now()).getFullYear();

  return (
    <>
      <Nav active="/browse" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HEADER BANNER */}
        <div className="rs-pad-xl" style={{ background: "var(--void)", borderBottom: "0.5px solid var(--border)", padding: "64px 64px 48px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--gold)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
              {loft.logo_url ? <Image src={loft.logo_url} alt={loft.name} fill style={{ objectFit: "cover" }} /> : loft.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                {loft.is_elite && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", border: "0.5px solid var(--border-gold)", padding: "3px 10px", borderRadius: 1 }}>◆ Elite Loft</span>}
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Member since {memberSince}</span>
              </div>
              <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, color: "var(--white)", marginBottom: 6 }}>{loft.name}</h1>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>{loft.profiles?.full_name || loft.profiles?.username}{loft.location ? ` · ${loft.location}` : ""}</p>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderBottom: "0.5px solid var(--border)" }}>
          {[
            [loft.total_birds_sold ?? 0, "Total Sales"],
            [`${avgRating}★`, "Avg Rating"],
            [loft.total_championships ?? 0, "Championships"],
            [activeBirds.length, "Active Listings"],
          ].map(([val, label]) => (
            <div key={String(label)} style={{ padding: "28px 40px", borderRight: "0.5px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="rs-2col-b rs-pad-lg" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 0, padding: "64px", alignItems: "start" }}>
          <div style={{ paddingRight: 64 }}>

            {loft.description && (
              <div style={{ marginBottom: 56 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>About This Loft</div>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, maxWidth: 640 }}>{loft.description}</p>
              </div>
            )}

            {/* ACTIVE LISTINGS */}
            <div style={{ marginBottom: 56 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>Active Listings</div>
                <Link href="/browse" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>View all →</Link>
              </div>
              {activeBirds.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>No active listings right now.</p>
              ) : (
                <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)" }}>
                  {activeBirds.map((b) => (
                    <div key={b.id} className="auction-card">
                      <div className="auction-img-wrap">
                        <div className="auction-badge" style={{ background: b.status === "live" ? "rgba(255,50,50,0.9)" : "rgba(212,175,55,0.9)", color: b.status === "live" ? "#fff" : "#000" }}>{b.status === "live" ? "● Live" : b.status === "upcoming" ? "Upcoming" : "Available"}</div>
                        {b.img && <Image src={b.img} alt={b.name} fill style={{ objectFit: "contain", objectPosition: "center bottom" }} />}
                      </div>
                      <div className="auction-body">
                        <div className="auction-name" style={{ fontSize: 18 }}>{b.name}</div>
                        <div className="auction-bid" style={{ marginTop: 8 }}>{b.bid ? `$${Number(b.bid).toLocaleString()}` : "No bids yet"}</div>
                        <Link href={`/birds/${b.id}`} style={{ display: "block", marginTop: 14, padding: "10px", background: "transparent", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", borderRadius: 1 }}>
                          {b.status === "live" ? "Place Bid" : "View Bird"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACHIEVEMENTS */}
            {achievements && achievements.length > 0 && (
              <div style={{ marginBottom: 56 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 20 }}>Competition Record</div>
                <div style={{ border: "0.5px solid var(--border)" }}>
                  {achievements.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 24, alignItems: "center", padding: "20px 24px", borderBottom: i < achievements.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--gold)", minWidth: 64 }}>
                        {a.competitions?.competition_date ? new Date(a.competitions.competition_date).getFullYear() : "—"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 3 }}>
                          {a.competitions?.name} — {a.placement === 1 ? "1st Place" : a.placement === 2 ? "2nd Place" : a.placement === 3 ? "3rd Place" : `${a.placement}th Place`}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {[a.kit_size && `Kit of ${a.kit_size}`, a.score && `Score ${a.score}`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {reviewsRaw && reviewsRaw.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 20 }}>Buyer Reviews</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
                  {reviewsRaw.map((r, i) => {
                    const reviewer = r.profiles?.username || "Anonymous";
                    return (
                      <div key={i} style={{ background: "var(--surface)", padding: "24px 28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                position: "relative",
                                width: 28,
                                height: 28,
                                flexShrink: 0,
                                borderRadius: "50%",
                                background: "var(--surface2)",
                                border: "1px solid var(--border-gold)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--ff-display)",
                                fontSize: 12,
                                color: "var(--gold)",
                                overflow: "hidden",
                              }}
                            >
                              {r.profiles?.avatar_url ? (
                                <Image src={r.profiles.avatar_url} alt={reviewer} fill style={{ objectFit: "cover" }} />
                              ) : (
                                reviewer.charAt(0).toUpperCase()
                              )}
                            </span>
                            <div style={{ fontSize: 13, color: "var(--white)" }}>{reviewer}</div>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}</div>
                        </div>
                        <div style={{ color: "var(--gold)", fontSize: 12, marginBottom: 8 }}>{"★".repeat(r.rating)}</div>
                        {r.body && <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{r.body}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Loft Details</div>
              {[
                ["Location", loft.location || "—"],
                ["Country", loft.country || "—"],
                ["Member Since", String(memberSince)],
                ["Pedigree Records", "Verified"],
              ].map(([label, val]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ color: "var(--white)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
