import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PreviewIcon from "@/components/PreviewIcon";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/PreviewTheme.module.css";

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
      <div style={{ paddingTop: 72 }}>
        <div className={`${styles.container} ${styles["page-heading"]}`}>
          <div className={styles.breadcrumb}>
            <Link href="/our-breeders">Loft directory</Link>
            <PreviewIcon name="down" className={styles.icon} />
            <span>{loft.name}</span>
          </div>
          <div className={styles["profile-hero"]}>
            <div className={`${styles.avatar} ${styles["gold-avatar"]}`} style={{ position: "relative", overflow: "hidden" }}>
              {loft.logo_url ? <Image src={loft.logo_url} alt={loft.name} fill style={{ objectFit: "cover" }} /> : loft.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.eyebrow}>
                {loft.is_elite && "◆ Elite Loft · "}Member since {memberSince}
              </div>
              <h1>{loft.name}</h1>
              <p>
                {loft.profiles?.full_name || loft.profiles?.username}
                {loft.location ? ` · ${loft.location}` : ""}
              </p>
            </div>
          </div>
        </div>

        <section className={`${styles.container} ${styles["page-section"]}`}>
          <div className={styles["stat-grid"]}>
            <div className={styles["stat-box"]}>
              <span>Total sales</span>
              <strong>{loft.total_birds_sold ?? 0}</strong>
            </div>
            <div className={styles["stat-box"]}>
              <span>Avg rating</span>
              <strong>{avgRating}★</strong>
            </div>
            <div className={styles["stat-box"]}>
              <span>Championships</span>
              <strong>{loft.total_championships ?? 0}</strong>
            </div>
            <div className={styles["stat-box"]}>
              <span>Active listings</span>
              <strong>{activeBirds.length}</strong>
            </div>
          </div>

          <div className={styles["split-layout"]}>
            <div>
              {loft.description && (
                <div className={styles.panel} style={{ marginBottom: 25 }}>
                  <h3>About this loft</h3>
                  <p style={{ color: "var(--muted)", marginTop: 12, lineHeight: 1.8 }}>{loft.description}</p>
                </div>
              )}

              <div style={{ marginBottom: 40 }}>
                <div className={styles["panel-heading"]}>
                  <h2>Active listings</h2>
                  <Link href="/browse" className={styles["link-arrow"]}>
                    View all <PreviewIcon name="arrow" className={styles.icon} />
                  </Link>
                </div>
                {activeBirds.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>No active listings right now.</p>
                ) : (
                  <div className={styles["auction-grid"]}>
                    {activeBirds.map((b) => (
                      <article key={b.id} className={styles["auction-card"]}>
                        <div className={styles["card-picture"]}>
                          {b.img && <Image src={b.img} alt={b.name} width={400} height={320} />}
                          <div className={styles["card-tags"]}>
                            <span className={styles.pill}>{b.status === "live" ? "● LIVE" : b.status === "upcoming" ? "UPCOMING" : "AVAILABLE"}</span>
                          </div>
                        </div>
                        <div className={styles["card-body"]}>
                          <h3>
                            <Link href={`/birds/${b.id}`}>{b.name}</Link>
                          </h3>
                          <div className={styles["card-meta"]}>{b.bid ? `$${Number(b.bid).toLocaleString()}` : "No bids yet"}</div>
                          <div className={styles["card-foot"]}>
                            <Link href={`/birds/${b.id}`}>
                              {b.status === "live" ? "Place bid" : "View bird"} <PreviewIcon name="arrowUp" className={styles.icon} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {achievements && achievements.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <h2 style={{ marginBottom: 20 }}>Competition record</h2>
                  <div className={styles["soft-list"]}>
                    {achievements.map((a, i) => (
                      <div key={i} className={styles["soft-row"]}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, color: "var(--gold)", minWidth: 60 }}>
                          {a.competitions?.competition_date ? new Date(a.competitions.competition_date).getFullYear() : "—"}
                        </div>
                        <div>
                          <strong>
                            {a.competitions?.name} — {a.placement === 1 ? "1st Place" : a.placement === 2 ? "2nd Place" : a.placement === 3 ? "3rd Place" : `${a.placement}th Place`}
                          </strong>
                          <small>{[a.kit_size && `Kit of ${a.kit_size}`, a.score && `Score ${a.score}`].filter(Boolean).join(" · ")}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviewsRaw && reviewsRaw.length > 0 && (
                <div>
                  <h2 style={{ marginBottom: 20 }}>Buyer reviews</h2>
                  <div className={styles["soft-list"]}>
                    {reviewsRaw.map((r, i) => {
                      const reviewer = r.profiles?.username || "Anonymous";
                      return (
                        <div key={i} className={styles.panel}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span className={styles.avatar} style={{ position: "relative", width: 28, height: 28, overflow: "hidden" }}>
                                {r.profiles?.avatar_url ? <Image src={r.profiles.avatar_url} alt={reviewer} fill style={{ objectFit: "cover" }} /> : reviewer.charAt(0).toUpperCase()}
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

            <div className={styles.panel}>
              <div className={styles.eyebrow}>Loft details</div>
              {[
                ["Location", loft.location || "—"],
                ["Country", loft.country || "—"],
                ["Member since", String(memberSince)],
                ["Pedigree records", "Verified"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ color: "var(--white)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
