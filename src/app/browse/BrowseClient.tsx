"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

type Bird = {
  id: string;
  name: string;
  loft: string;
  location: string;
  bid: string;
  status: string;
  img: string | null;
  tags: string[];
};

const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
  live: { label: "● Live", bg: "rgba(255,50,50,0.9)", color: "#fff" },
  upcoming: { label: "Upcoming", bg: "rgba(212,175,55,0.9)", color: "#000" },
  available: { label: "Available", bg: "rgba(255,255,255,0.12)", color: "#fff" },
};

export default function BrowseClient({ birds }: { birds: Bird[] }) {
  const [statusFilters, setStatusFilters] = useState(["live", "available", "upcoming"]);

  function toggleStatus(s: string) {
    setStatusFilters((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }

  const filtered = birds.filter((b) => statusFilters.length === 0 || statusFilters.includes(b.status));

  return (
    <>
      <div style={{ paddingTop: 72, display: "flex", minHeight: "100vh", background: "var(--black)" }}>
        {/* FILTER SIDEBAR */}
        <div className="rs-hide-mobile" style={{ width: 280, background: "var(--void)", borderRight: "0.5px solid var(--border)", padding: "32px 24px", flexShrink: 0, position: "sticky", top: 72, height: "calc(100vh - 72px)", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--white)" }}>Filters</span>
            <span onClick={() => setStatusFilters([])} style={{ fontSize: 11, color: "var(--gold)", cursor: "pointer", letterSpacing: "0.05em" }}>Clear all</span>
          </div>

          <FilterSection label="Status">
            {[["live", "Live auction", 12], ["available", "Available now", 48], ["upcoming", "Upcoming auction", 9]].map(([val, label, count]) => (
              <label key={val} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                <input type="checkbox" checked={statusFilters.includes(val as string)} onChange={() => toggleStatus(val as string)} style={{ accentColor: "var(--gold)" }} />
                <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>{label as string}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{count}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection label="Color variety">
            {[["Blue Bar", 44], ["Red Self", 28], ["Silver / Dun", 22], ["White / Badge", 19], ["Black / Spread", 11]].map(([label, count]) => (
              <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "var(--gold)" }} />
                <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>{label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{count}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection label="Sex">
            {[["Cock (Male)", 78], ["Hen (Female)", 61], ["Breeding pair", 21]].map(([label, count]) => (
              <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "var(--gold)" }} />
                <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>{label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{count}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection label="Certifications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
              {["Verified Pedigree", "DNA Confirmed", "Health Cert", "NBRC Registered"].map((c) => (
                <span key={c} style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 10px", border: "0.5px solid var(--border-gold)", color: "var(--gold)", borderRadius: 1, cursor: "pointer" }}>{c}</span>
              ))}
            </div>
          </FilterSection>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: "0 0 80px" }}>
          {/* Breadcrumb */}
          <div style={{ background: "var(--surface)", borderBottom: "0.5px solid var(--border)", padding: "12px 40px", fontSize: 12, color: "var(--muted)" }}>
            <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "var(--white)" }}>Browse Birds</span>
          </div>

          {/* Results header */}
          <div style={{ padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}><span style={{ color: "var(--white)", fontWeight: 500 }}>{filtered.length}</span> birds found</span>
            <select style={{ background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--muted)", padding: "8px 14px", fontSize: 12, borderRadius: 2, outline: "none" }}>
              <option>Sort: Ending soonest</option>
              <option>Sort: Price low → high</option>
              <option>Sort: Price high → low</option>
              <option>Sort: Recently added</option>
            </select>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ margin: 40, padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>No birds match these filters yet.</div>
          ) : (
          <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", padding: "1px", margin: "40px" }}>
            {filtered.map((bird) => {
              const badge = statusBadge[bird.status];
              return (
                <div key={bird.id} className="auction-card">
                  <div className="auction-img-wrap">
                    <div className="auction-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</div>
                    {bird.img && <Image src={bird.img} alt={bird.name} fill style={{ objectFit: "contain", objectPosition: "center bottom" }} />}
                  </div>
                  <div className="auction-body">
                    <div className="auction-name">{bird.name}</div>
                    <div className="auction-breeder">{bird.loft} · {bird.location}</div>
                    <div className="auction-meta">
                      <div>
                        <div className="auction-bid-label">{bird.status === "live" ? "Current bid" : "Starting bid"}</div>
                        <div className="auction-bid">{bird.bid}</div>
                      </div>
                    </div>
                    <div className="auction-tags" style={{ marginTop: 12 }}>
                      {bird.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <Link href={`/birds/${bird.id}`} style={{ display: "block", marginTop: 16, width: "100%", padding: 10, background: "transparent", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: 1, textAlign: "center", textDecoration: "none", transition: "all 0.2s" }}>
                      {bird.status === "available" ? "View Bird" : "Place Bid"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: "0.5px solid var(--border)" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>{label}</div>
      {children}
    </div>
  );
}
