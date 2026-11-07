import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import PreviewIcon from "@/components/PreviewIcon";
import Reveal from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";
import ParallaxDrift from "@/components/ParallaxDrift";
import { getSiteImages } from "@/lib/site-images";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "@/styles/PreviewTheme.module.css";

function LinkArrow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles["link-arrow"]}>
      {children}
      <PreviewIcon name="arrow" className={styles.icon} />
    </Link>
  );
}

export default async function Home() {
  const siteImages = await getSiteImages();

  const admin = createAdminClient();
  const [{ data: latestIssue }, { data: liveAuctions }, { count: liveCount }] = await Promise.all([
    admin
      .from("magazine_issues")
      .select("id, issue_number, title, cover_image_url")
      .order("issue_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("auctions")
      .select(
        "id, current_bid, starting_bid, status, ends_at, starts_at, bird_id, birds(id, name, certification_status, dna_certified, health_certified, primary_photo_url), lofts(name, location)"
      )
      .in("status", ["live", "scheduled"])
      .order("ends_at", { ascending: true })
      .limit(6),
    admin.from("auctions").select("id", { count: "exact", head: true }).eq("status", "live"),
  ]);

  const auctionCards = (liveAuctions ?? []).map((auction) => {
    const bird = auction.birds;
    const isLive = auction.status === "live";
    const secondsLeft = isLive && auction.ends_at ? Math.max(0, Math.round((new Date(auction.ends_at).getTime() - Date.now()) / 1000)) : 0;
    const tags = [
      bird?.certification_status === "certified" && "★ Rollers Only Certified",
      bird?.dna_certified && "DNA Cert",
      bird?.health_certified && "Health Cert",
    ].filter(Boolean) as string[];
    return {
      id: bird?.id ?? auction.bird_id,
      isLive,
      imgUrl: bird?.primary_photo_url || "/bird-white-red.jpg",
      name: bird?.name || "Unnamed bird",
      breeder: [auction.lofts?.name, auction.lofts?.location].filter(Boolean).join(" · "),
      bidLabel: isLive ? "Current bid" : "Opening bid",
      bid: `$${Number(auction.current_bid ?? auction.starting_bid ?? 0).toLocaleString()}`,
      timeLabel: isLive ? "Ends in" : "Starts",
      seconds: secondsLeft,
      scheduleLabel: auction.status === "scheduled" ? `Starts ${new Date(auction.starts_at).toLocaleDateString()}` : "Coming soon",
      tags,
    };
  });

  return (
    <>
      <Nav active="/" />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles["hero-inner"]}`}>
          <div className={styles["hero-copy"]}>
            <div className={styles.eyebrow}>Bringing the entire pigeon world to one place</div>
            <h1>
              THE ROLLER PIGEON WORLD, RIGHT HERE.
              <span>ONLY ROLLERS.</span>
            </h1>
            <p className={styles["hero-description"]}>
              The next generation of the roller pigeon community. Discover birds, explore bloodlines, and connect
              with people who share your passion.
            </p>
            <div className={styles["hero-buttons"]}>
              <Link href="/auctions" className={`${styles.btn} ${styles["btn-primary"]}`}>
                Explore auctions <PreviewIcon name="arrowUp" className={styles.icon} />
              </Link>
              <Link href="/our-breeders" className={styles.btn}>
                Find your community
              </Link>
            </div>
            <div className={styles["hero-bottom"]}>
              <span>
                <PreviewIcon name="tree" className={styles.icon} />
                Know the bloodline
              </span>
              <span>
                <PreviewIcon name="globe" className={styles.icon} />
                Connect beyond your loft
              </span>
            </div>
          </div>
          <div className={`${styles["hero-art"]} ${styles["tilt-perspective"]}`}>
            <div className={styles.orbital} />
            <div className={`${styles.orbital} ${styles["orbit-2"]}`} />
            <TiltCard maxTilt={7} style={{ position: "absolute", inset: 0 }}>
              <Image
                src={siteImages.hero}
                alt="Roller pigeon"
                width={1024}
                height={1536}
                className={styles["hero-image"]}
                priority
              />
            </TiltCard>
            <div className={`${styles["hero-coordinate"]} ${styles.mono}`}>
              THE BIRMINGHAM ROLLER
              <br />
              A PASSION WITHOUT BORDERS
              <br />
              <span className={styles.gold}>RO / NEXT CHAPTER</span>
            </div>
            <div className={styles["hero-callout"]}>
              <span className={styles["small-caps"]}>Not just birds. A legacy.</span>
              <strong>
                Your next chapter
                <br />
                starts in the loft.
              </strong>
              <LinkArrow href="/family-tree">Explore bloodlines</LinkArrow>
            </div>
            <div className={styles["hero-caption"]}>
              <span>01 /</span> THE SPORT. REIMAGINED.
            </div>
          </div>
        </div>
      </section>

      {/* PATHWAYS */}
      <div className={styles.container}>
        <div className={styles.pathways}>
          <Reveal i={0}>
            <Link className={styles.pathway} href="/auctions">
              <PreviewIcon name="gavel" className={styles.icon} />
              <span>
                <strong>The auction room</strong>
                <small>Find your next great bird</small>
              </span>
              <PreviewIcon name="arrowUp" className={`${styles.icon} ${styles["path-arrow"]}`} />
            </Link>
          </Reveal>
          <Reveal i={1}>
            <Link className={styles.pathway} href="/family-tree">
              <PreviewIcon name="tree" className={styles.icon} />
              <span>
                <strong>Explore bloodlines</strong>
                <small>Every bird has a story</small>
              </span>
              <PreviewIcon name="arrowUp" className={`${styles.icon} ${styles["path-arrow"]}`} />
            </Link>
          </Reveal>
          <Reveal i={2}>
            <Link className={styles.pathway} href="/dashboard/loft">
              <PreviewIcon name="home" className={styles.icon} />
              <span>
                <strong>Your digital loft</strong>
                <small>Build a lasting record</small>
              </span>
              <PreviewIcon name="arrowUp" className={`${styles.icon} ${styles["path-arrow"]}`} />
            </Link>
          </Reveal>
          <Reveal i={3}>
            <Link className={styles.pathway} href="/decade-of-the-spinner">
              <PreviewIcon name="book" className={styles.icon} />
              <span>
                <strong>Inside D.O.T.S.</strong>
                <small>The voice of the sport</small>
              </span>
              <PreviewIcon name="arrowUp" className={`${styles.icon} ${styles["path-arrow"]}`} />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* AUCTION ROOM */}
      <section className={`${styles.section} ${styles["home-auctions"]} ${styles.container}`}>
        <div className={styles["section-top"]}>
          <div>
            <div className={styles.eyebrow}>The auction room</div>
            <h2>Find your next great bird.</h2>
          </div>
        </div>
        <div className={styles["auction-grid"]}>
          {auctionCards.map((card, i) => (
            <Reveal key={card.id} i={i}>
              <article className={styles["auction-card"]}>
                <div className={styles["card-picture"]}>
                  <Link href={`/birds/${card.id}`} aria-label={`View ${card.name}`}>
                    <Image src={card.imgUrl} alt={card.name} width={600} height={480} />
                  </Link>
                  <div className={styles["card-tags"]}>
                    <span className={styles.pill}>{card.isLive ? "● LIVE" : "UPCOMING"}</span>
                  </div>
                </div>
                <div className={styles["card-body"]}>
                  <div className={styles["lot-number"]}>{card.breeder.toUpperCase()}</div>
                  <h3>
                    <Link href={`/birds/${card.id}`}>{card.name}</Link>
                  </h3>
                  <div className={styles["card-meta"]}>{card.tags?.join(" · ")}</div>
                  <div className={styles["bid-row"]}>
                    <div>
                      <label>{card.bidLabel}</label>
                      <strong>
                        {card.bid}
                        <small>USD</small>
                      </strong>
                    </div>
                    <div className={styles["time-box"]}>
                      <label>{card.timeLabel}</label>
                      {card.isLive ? <Countdown seconds={card.seconds} /> : <span>{card.scheduleLabel}</span>}
                    </div>
                  </div>
                  <div className={styles["card-foot"]}>
                    <Link href={`/birds/${card.id}`}>
                      View bird <PreviewIcon name="arrowUp" className={styles.icon} />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className={styles["section-bottom"]}>
          <p>{liveCount ?? 0} live auctions running right now — verified pedigrees, escrow-protected.</p>
          <LinkArrow href="/auctions">Enter the auction room</LinkArrow>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className={`${styles.ecosystem} ${styles.container}`}>
        <div className={styles["section-top"]}>
          <div>
            <div className={styles.eyebrow}>Every part of your passion</div>
            <h2>More than a marketplace.</h2>
          </div>
          <LinkArrow href="/about-the-creator">Meet the founders</LinkArrow>
        </div>
        <div className={styles["feature-duo"]}>
          <Reveal i={0}>
            <article className={styles["feature-panel"]}>
              <div className={`${styles.eyebrow} ${styles.cyan}`}>Your digital loft</div>
              <h3>
                Keep the history.
                <br />
                Build the future.
              </h3>
              <p>
                Birds, bloodlines, breeding pairs, and the notes that matter. One beautifully organized home for your
                loft.
              </p>
              <LinkArrow href="/dashboard/loft">Step inside My Loft</LinkArrow>
              <div className={styles["mini-loft"]}>
                <div className={styles["mini-loft-head"]}>
                  <span>MY LOFT / SAMPLE WORKSPACE</span>
                  <PreviewIcon name="grid" className={styles.icon} />
                </div>
                <div className={styles["mini-loft-row"]}>
                  <Image src={siteImages.bird_black_centertail} alt="Roller pigeon" width={60} height={60} />
                  <span>
                    <strong>Verified pedigree bird</strong>
                    <small>Tracked from hatch to hammer</small>
                  </span>
                  <span className={`${styles.pill} ${styles.cyan}`}>Pedigree record</span>
                </div>
              </div>
            </article>
          </Reveal>
          <Reveal i={1}>
            <article className={`${styles["feature-panel"]} ${styles["mag-feature"]}`}>
              <div className={styles["feature-text"]}>
                <div className={styles.eyebrow}>Decade of the Spinner</div>
                <h3>
                  The stories.
                  <br />
                  The people.
                  <br />
                  The passion.
                </h3>
                <p>Go beyond the score. Explore the magazine made for the world of roller pigeons.</p>
                <LinkArrow href="/decade-of-the-spinner">Open the magazine</LinkArrow>
                <div className={styles["issue-label"]}>
                  D.O.T.S. / {latestIssue ? `ISSUE ${latestIssue.issue_number}` : "FROM THE ARCHIVE"}
                </div>
              </div>
              <TiltCard
                className={styles["tilt-perspective"]}
                maxTilt={9}
                style={{ position: "absolute", right: 24, bottom: 24, width: "40%", height: "75%", rotate: "9deg" }}
              >
                <Image
                  src={siteImages.mag_cover_small}
                  alt="Decade of the Spinner cover"
                  fill
                  style={{ objectFit: "contain", objectPosition: "center bottom", borderRadius: 3, boxShadow: "-20px 20px 50px #000a" }}
                />
              </TiltCard>
            </article>
          </Reveal>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className={styles.container}>
        <div className={styles["community-band"]}>
          <ParallaxDrift range={25}>
            <Image
              className={styles["community-photo"]}
              src={siteImages.community_photo}
              alt="Championship trophy from the roller pigeon community"
              width={435}
              height={690}
            />
          </ParallaxDrift>
          <div className={styles["community-copy"]}>
            <div className={`${styles.eyebrow} ${styles.cyan}`}>The people behind the pigeons</div>
            <h2>
              A shared sky.
              <br />
              A stronger community.
            </h2>
            <p>
              Trade knowledge. Discover another loft. Share the moments that keep you looking up. This is where the
              sport comes together.
            </p>
            <LinkArrow href="/our-breeders">Join the conversation</LinkArrow>
          </div>
        </div>
      </section>

      {/* WORLD */}
      <section className={styles["world-section"]}>
        <Reveal className={styles.container}>
          <div className={styles.eyebrow}>One passion. No boundaries.</div>
          <h2>
            THE WORLD IS
            <br />
            <span>OUR BACKYARD.</span>
          </h2>
          <p>
            A global vision, built one connection at a time.
            <br />
            Bring your passion. Find your people.
          </p>
          <div className={styles["country-row"]}>
            <span>North America</span>
            <span>United Kingdom</span>
            <span>Europe</span>
            <span>Africa</span>
            <span>Beyond</span>
          </div>
          <Link href="/our-breeders" className={`${styles.btn} ${styles["btn-primary"]}`}>
            Explore the community <PreviewIcon name="arrowUp" className={styles.icon} />
          </Link>
        </Reveal>
      </section>

      {/* PRICING */}
      <div className="pricing-section">
        <div className="pricing-header">
          <p className="section-eyebrow">Membership</p>
          <h2 className="section-title">Choose Your Tier</h2>
          <p className="section-sub" style={{ margin: "0 auto" }}>
            From passionate hobbyist to world-class elite breeder — there&apos;s a place for you.
          </p>
        </div>
        <div className="pricing-grid">
          <Reveal i={0}>
            <div className="pricing-card">
              <div className="pricing-tier">Fancier</div>
              <div className="pricing-price">
                <sup>$</sup>19<sub>/mo</sub>
              </div>
              <div className="pricing-desc">Browse, bid, and buy with full buyer protection.</div>
              <div className="pricing-feature">Full marketplace access</div>
              <div className="pricing-feature">Bid in live auctions</div>
              <div className="pricing-feature">View verified pedigrees</div>
              <div className="pricing-feature">Escrow buyer protection</div>
              <div className="pricing-feature">Competition leaderboards</div>
              <div className="pricing-action">
                <Link href="/signup" className="btn-ghost" style={{ display: "block", textAlign: "center", padding: "12px" }}>
                  Get started
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal i={1}>
            <div className="pricing-card featured">
              <div className="pricing-tier">Breeder</div>
              <div className="pricing-price">
                <sup>$</sup>49<sub>/mo</sub>
              </div>
              <div className="pricing-desc">List your birds, build your loft reputation globally.</div>
              <div className="pricing-feature">Everything in Fancier</div>
              <div className="pricing-feature">Unlimited bird listings</div>
              <div className="pricing-feature">Public loft profile page</div>
              <div className="pricing-feature">Pedigree registry access</div>
              <div className="pricing-feature">AI breeding matchmaker</div>
              <div className="pricing-feature">Fly video uploads</div>
              <div className="pricing-action">
                <Link href="/signup" className="btn-gold" style={{ display: "block", textAlign: "center", padding: "12px" }}>
                  Join as Breeder
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal i={2}>
            <div className="pricing-card">
              <div className="pricing-tier">Elite Loft</div>
              <div className="pricing-price">
                <sup>$</sup>149<sub>/mo</sub>
              </div>
              <div className="pricing-desc">For champion breeders who demand maximum reach and credibility.</div>
              <div className="pricing-feature">Everything in Breeder</div>
              <div className="pricing-feature">Featured placement in auctions</div>
              <div className="pricing-feature">Verified Elite badge</div>
              <div className="pricing-feature">Championship auction priority</div>
              <div className="pricing-feature">DNA cert display</div>
              <div className="pricing-feature">Full analytics dashboard</div>
              <div className="pricing-action">
                <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost" style={{ display: "block", textAlign: "center", padding: "12px" }}>
                  Apply for Elite
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <ParallaxDrift className="cta-bird-left-wrap" range={30}>
          <Image src={siteImages.bird_red2} alt="" width={400} height={500} className="cta-bird-left" aria-hidden />
        </ParallaxDrift>
        <ParallaxDrift className="cta-bird-right-wrap" range={30}>
          <Image src={siteImages.bird_lavender} alt="" width={400} height={500} className="cta-bird-right" aria-hidden />
        </ParallaxDrift>
        <h2 className="cta-title">
          Your Birds Deserve
          <br />a <em>World-Class</em> Stage
        </h2>
        <p className="cta-sub">Join thousands of roller pigeon fanciers who trust RollersOnly for every transaction.</p>
        <div className="cta-actions">
          <Link href="/signup" className="btn-gold-lg">
            Create Your Loft Profile
          </Link>
          <Link href="/auctions" className="btn-ghost-lg">
            Browse Live Auctions
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
