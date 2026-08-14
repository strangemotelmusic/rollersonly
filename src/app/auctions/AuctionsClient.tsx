"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import Countdown from "@/components/Countdown";
import type { SiteImageKey } from "@/lib/site-images";

const liveAuctions = [
  { id: 1, name: "Blue Bar Champion Cock", loft: "Schoening Loft", location: "Montana, USA", bid: "$1,240", bids: 14, seconds: 8280, imgKey: "bird_white_red", tags: ["Verified Pedigree", "DNA Cert"], featured: true },
  { id: 2, name: "Red Self Breeding Hen", loft: "Glenn Loft", location: "Ohio, USA", bid: "$780", bids: 9, seconds: 19440, imgKey: "bird_red", tags: ["World Cup Line", "Health Cert"], featured: false },
  { id: 5, name: "White Badge Roller Hen", loft: "Deacon Loft", location: "Midlands, UK", bid: "$650", bids: 7, seconds: 32040, imgKey: "bird_white_red2", tags: ["NBRC Champion", "Health Cert"], featured: false },
  { id: 7, name: "Silver Dun Champion Cock", loft: "Schoening Loft", location: "Montana, USA", bid: "$920", bids: 11, seconds: 5400, imgKey: "bird_white_red", tags: ["World Cup Line", "DNA Cert"], featured: false },
] as const;

const upcomingAuctions = [
  { id: 3, name: "Lavender Breeding Pair", loft: "Whelan Loft", location: "Ireland", startBid: "$1,100", date: "Tomorrow · 2:00 PM CT", imgKey: "bird_lavender", tags: ["Breeding Pair", "Verified Pedigree"] },
  { id: 9, name: "Grizzle Breeding Pair", loft: "Deacon Loft", location: "Midlands, UK", startBid: "$2,400", date: "Fri · 10:00 AM CT", imgKey: "bird_red", tags: ["NBRC Champion", "DNA Cert", "Health Cert"] },
  { id: 12, name: "Dun Bar Young Cock", loft: "Rossouw Loft", location: "Free State, South Africa", startBid: "$310", date: "Sat · 12:00 PM CT", imgKey: "bird_red2", tags: ["Verified Pedigree", "Health Cert"] },
] as const;

export default function AuctionsClient({ images }: { images: Record<SiteImageKey, string> }) {
  const [tab, setTab] = useState<"live" | "upcoming">("live");

  return (
    <>
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HERO */}
        <div className="rs-pad-xl" style={{ background: "var(--void)", padding: "64px 64px 48px", borderBottom: "0.5px solid var(--border)" }}>
          <div className="rs-flex-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>Live Auction House</p>
              <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16 }}>
                Birmingham Rollers,<br /><em style={{ color: "var(--gold)" }}>Bid Live</em>
              </h1>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 520 }}>
                Real-time auctions with verified pedigrees and same-day video. Every bid is visible the moment it lands.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <div className="live-dot">Live Now — {liveAuctions.length} Auctions</div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderBottom: "0.5px solid var(--border)" }}>
          {[["4", "Live Now"], ["3", "Starting Today"], [`$${(1240+780+650+920).toLocaleString()}`, "Total Bid Value"], ["41", "Active Bidders"]].map(([val, label]) => (
            <div key={label} style={{ padding: "28px 40px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="rs-pad-lg" style={{ padding: "48px 64px 80px" }}>

          {/* TABS */}
          <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid var(--border)", marginBottom: 40 }}>
            {(["live", "upcoming"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 28px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "none", borderBottom: tab === t ? "2px solid var(--gold)" : "none", color: tab === t ? "var(--gold)" : "var(--muted)", cursor: "pointer", marginBottom: -1 }}>
                {t === "live" ? `Live (${liveAuctions.length})` : `Upcoming (${upcomingAuctions.length})`}
              </button>
            ))}
          </div>

          {tab === "live" && (
            <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "var(--border)" }}>
              {liveAuctions.map((a) => (
                <div key={a.id} className="auction-card rs-card-row" style={{ display: "grid", gridTemplateColumns: "220px 1fr" }}>
                  <div style={{ position: "relative", background: "#000" }}>
                    <div className="auction-badge badge-live">● Live</div>
                    <Image src={images[a.imgKey]} alt={a.name} fill style={{ objectFit: "contain", objectPosition: "center bottom" }} />
                  </div>
                  <div className="auction-body" style={{ borderTop: "none", borderLeft: "0.5px solid var(--border)" }}>
                    <div className="auction-name">{a.name}</div>
                    <div className="auction-breeder">{a.loft} · {a.location}</div>
                    <div className="auction-meta">
                      <div>
                        <div className="auction-bid-label">Current bid</div>
                        <div className="auction-bid">{a.bid}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{a.bids} bids</div>
                      </div>
                      <div className="auction-timer">
                        <div className="timer-label">Ends in</div>
                        <div className="timer-val"><Countdown seconds={a.seconds} /></div>
                      </div>
                    </div>
                    <div className="auction-tags" style={{ marginTop: 12 }}>
                      {a.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <Link href={`/birds/${a.id}`} style={{ flex: 1, padding: "10px", background: "transparent", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", borderRadius: 1 }}>Place Bid</Link>
                      <Link href={`/auctions/${a.id}`} style={{ padding: "10px 14px", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--muted)", fontSize: 11, textDecoration: "none", borderRadius: 1 }}>Live Room →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "upcoming" && (
            <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)" }}>
              {upcomingAuctions.map((a) => (
                <div key={a.id} className="auction-card">
                  <div className="auction-img-wrap">
                    <div className="auction-badge" style={{ background: "rgba(212,175,55,0.9)", color: "#000" }}>Upcoming</div>
                    <Image src={images[a.imgKey]} alt={a.name} fill style={{ objectFit: "contain", objectPosition: "center bottom" }} />
                  </div>
                  <div className="auction-body">
                    <div className="auction-name">{a.name}</div>
                    <div className="auction-breeder">{a.loft} · {a.location}</div>
                    <div style={{ marginTop: 12 }}>
                      <div className="auction-bid-label">Starting bid</div>
                      <div className="auction-bid">{a.startBid}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 8 }}>🗓 {a.date}</div>
                    <div className="auction-tags" style={{ marginTop: 12 }}>
                      {a.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <Link href="/signup" style={{ display: "block", marginTop: 16, padding: "10px", background: "transparent", border: "0.5px solid var(--border)", color: "var(--muted)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", borderRadius: 1 }}>Set Reminder</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SELL CTA */}
          <div className="rs-flex-row" style={{ marginTop: 64, background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: "40px 48px", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Ready to list your bird?</div>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>Breeder and Elite Loft subscribers can run live auctions to buyers worldwide.</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <Link href="/how-it-works" className="btn-ghost">How It Works</Link>
              <Link href="/signup" className="btn-gold">Start Selling</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
