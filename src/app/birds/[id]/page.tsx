import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PreviewIcon from "@/components/PreviewIcon";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import BirdBidBox from "./BirdBidBox";
import BirdGallery from "./BirdGallery";
import styles from "@/styles/PreviewTheme.module.css";

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
       sire_id, dam_id,
       lofts(name, location, slug, rating, total_birds_sold),
       profiles!birds_owner_id_fkey(username, full_name, tier),
       bird_photos(url, is_primary, sort_order),
       auctions(id, current_bid, starting_bid, bid_increment, status, ends_at, seller_id, winner_id, final_price, escrow_held,
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

  const [{ data: sire }, { data: dam }] = await Promise.all([
    bird.sire_id ? supabase.from("birds").select("id, name, ring_number").eq("id", bird.sire_id).maybeSingle() : Promise.resolve({ data: null }),
    bird.dam_id ? supabase.from("birds").select("id, name, ring_number").eq("id", bird.dam_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

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

  const sellerName = bird.profiles?.full_name || bird.profiles?.username || "Unknown seller";
  const sellerInitial = sellerName.charAt(0).toUpperCase();

  return (
    <>
      <Nav active="/browse" />
      <div style={{ paddingTop: 72 }}>
        <div className={`${styles.container} ${styles["page-heading"]}`}>
          <div className={styles.breadcrumb}>
            <Link href="/browse">Browse Birds</Link>
            <PreviewIcon name="down" className={styles.icon} />
            <span>{bird.name || "Unnamed bird"}</span>
          </div>
          <Link href="/browse" className={`${styles.btn} ${styles["btn-small"]}`}>
            <PreviewIcon name="left" className={styles.icon} /> Back to all birds
          </Link>
        </div>

        <section className={`${styles.container} ${styles["page-section"]}`}>
          <div className={styles["lot-layout"]}>
            <div>
              <BirdGallery
                photos={photos}
                alt={bird.name || "Bird"}
                isLive={auction?.status === "live"}
                dnaCertified={Boolean(bird.dna_certified)}
                healthCertified={Boolean(bird.health_certified)}
                rollersOnlyCertified={bird.certification_status === "certified"}
              />
            </div>

            <div className={styles["lot-info"]}>
              <div className={styles.eyebrow}>{bird.lofts ? bird.lofts.name : "Independent seller"}</div>
              <h1>{bird.name || "Unnamed bird"}</h1>
              <p>
                {[bird.ring_number, bird.color, bird.lofts?.location].filter(Boolean).join(" · ") || "No further details on file."}
              </p>
              <div className={styles["lot-quick"]}>
                {bird.sex && <span className={styles.pill}>{bird.sex}</span>}
                {bird.certification_status === "certified" && <span className={styles.pill}>Rollers Only Certified</span>}
                <span className={`${styles.pill} ${styles.cyan}`}>Escrow-protected</span>
              </div>

              <div className={styles["lot-bid-panel"]} style={{ padding: 0, border: "none", background: "none" }}>
                <BirdBidBox auction={auction} bids={bids} currentUserId={user?.id ?? null} isBrowseOnly={profile?.tier === "browse"} />
              </div>

              <div className={styles["lot-facts"]}>
                <div>
                  <label>Ring number</label>
                  <strong>{bird.ring_number || "—"}</strong>
                </div>
                <div>
                  <label>Color</label>
                  <strong>{bird.color || "—"}</strong>
                </div>
                <div>
                  <label>Shipping model</label>
                  <strong>Seller-paid, escrow-protected</strong>
                </div>
                <div>
                  <label>Records</label>
                  <strong>{sire || dam ? "Pedigree on file" : "Not yet verified"}</strong>
                </div>
              </div>

              {bird.lofts && (
                <div className={styles["seller-inline"]}>
                  <div className={`${styles.avatar} ${styles["gold-avatar"]}`}>{sellerInitial}</div>
                  <div>
                    <strong>{sellerName}</strong>
                    <small>{bird.lofts.name}{bird.lofts.location ? ` · ${bird.lofts.location}` : ""}</small>
                  </div>
                  <Link href={`/loft/${bird.lofts.slug}`} className={styles["link-arrow"]}>
                    View loft <PreviewIcon name="arrow" className={styles.icon} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {(stats.length > 0 || sire || dam || bird.notes) && (
            <div className={styles.panel} style={{ marginTop: 40 }}>
              {bird.notes && (
                <div style={{ marginBottom: stats.length || sire || dam ? 28 : 0 }}>
                  <h3>Overview</h3>
                  <p style={{ color: "var(--muted)", marginTop: 10, lineHeight: 1.7 }}>{bird.notes}</p>
                </div>
              )}
              {stats.length > 0 && (
                <div style={{ marginBottom: sire || dam ? 28 : 0 }}>
                  <h3>Performance</h3>
                  <div className={styles["stat-grid"]} style={{ marginTop: 16, marginBottom: 0 }}>
                    {stats.map(({ label, val }) => (
                      <div key={label} className={styles["stat-box"]}>
                        <span>{label}</span>
                        <strong>{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(sire || dam) && (
                <div>
                  <h3>Pedigree</h3>
                  <div className={styles["form-grid"]} style={{ marginTop: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sire</label>
                      <div style={{ fontSize: 15, color: "var(--white)", marginTop: 6 }}>
                        {sire ? (
                          <Link href={`/birds/${sire.id}`} style={{ color: "var(--gold)" }}>
                            {sire.name || sire.ring_number || "View bird"}
                          </Link>
                        ) : (
                          "Not on file"
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Dam</label>
                      <div style={{ fontSize: 15, color: "var(--white)", marginTop: 6 }}>
                        {dam ? (
                          <Link href={`/birds/${dam.id}`} style={{ color: "var(--gold)" }}>
                            {dam.name || dam.ring_number || "View bird"}
                          </Link>
                        ) : (
                          "Not on file"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {relatedBirds.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h3 style={{ marginBottom: 20 }}>More from this loft</h3>
              <div className={styles["auction-grid"]}>
                {relatedBirds.map((b) => (
                  <Link key={b.id} href={`/birds/${b.id}`} className={styles["auction-card"]}>
                    <div className={styles["card-picture"]}>
                      {b.primary_photo_url && <Image src={b.primary_photo_url} alt={b.name || "Bird"} width={400} height={320} />}
                    </div>
                    <div className={styles["card-body"]}>
                      <h3>{b.name || "Unnamed bird"}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}
