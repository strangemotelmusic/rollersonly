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
  sex: string | null;
  color: string | null;
  certified: boolean;
  dnaCertified: boolean;
  healthCertified: boolean;
  tags: string[];
};

const CERT_OPTIONS = ["Verified Pedigree", "DNA Confirmed", "Health Cert"] as const;

function birdHasCert(bird: Bird, cert: string) {
  if (cert === "Verified Pedigree") return bird.certified;
  if (cert === "DNA Confirmed") return bird.dnaCertified;
  if (cert === "Health Cert") return bird.healthCertified;
  return false;
}

const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
  live: { label: "● Live", bg: "rgba(255,50,50,0.9)", color: "#fff" },
  upcoming: { label: "Upcoming", bg: "rgba(212,175,55,0.9)", color: "#000" },
  available: { label: "Available", bg: "rgba(255,255,255,0.12)", color: "#fff" },
};

export default function BrowseClient({ birds }: { birds: Bird[] }) {
  const [statusFilters, setStatusFilters] = useState(["live", "available", "upcoming"]);
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const [sexFilters, setSexFilters] = useState<string[]>([]);
  const [certFilters, setCertFilters] = useState<string[]>([]);

  function toggleStatus(s: string) {
    setStatusFilters((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }
  function toggle(setter: React.Dispatch<React.SetStateAction<string[]>>, v: string) {
    setter((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  }

  const statusCounts = { live: 0, available: 0, upcoming: 0 } as Record<string, number>;
  const colorCounts = new Map<string, number>();
  const sexCounts = new Map<string, number>();
  for (const b of birds) {
    statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1;
    if (b.color) colorCounts.set(b.color, (colorCounts.get(b.color) ?? 0) + 1);
    if (b.sex) sexCounts.set(b.sex, (sexCounts.get(b.sex) ?? 0) + 1);
  }

  const filtered = birds.filter((b) => {
    if (statusFilters.length > 0 && !statusFilters.includes(b.status)) return false;
    if (colorFilters.length > 0 && (!b.color || !colorFilters.includes(b.color))) return false;
    if (sexFilters.length > 0 && (!b.sex || !sexFilters.includes(b.sex))) return false;
    if (certFilters.length > 0 && !certFilters.every((c) => birdHasCert(b, c))) return false;
    return true;
  });

  return (
    <>
      <div style={{ paddingTop: 72, display: "flex", minHeight: "100vh", background: "var(--black)" }}>
        {/* FILTER SIDEBAR */}
        <div className="rs-hide-mobile" style={{ width: 280, background: "var(--void)", borderRight: "0.5px solid var(--border)", padding: "32px 24px", flexShrink: 0, position: "sticky", top: 72, height: "calc(100vh - 72px)", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--white)" }}>Filters</span>
            <span
              onClick={() => { setStatusFilters([]); setColorFilters([]); setSexFilters([]); setCertFilters([]); }}
              style={{ fontSize: 11, color: "var(--gold)", cursor: "pointer", letterSpacing: "0.05em" }}
            >
              Clear all
            </span>
          </div>

          <FilterSection label="Status">
            {([["live", "Live auction"], ["available", "Available now"], ["upcoming", "Upcoming auction"]] as const).map(([val, label]) => (
              <label key={val} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                <input type="checkbox" checked={statusFilters.includes(val)} onChange={() => toggleStatus(val)} style={{ accentColor: "var(--gold)" }} />
                <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>{label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{statusCounts[val] ?? 0}</span>
              </label>
            ))}
          </FilterSection>

          {colorCounts.size > 0 && (
            <FilterSection label="Color variety">
              {[...colorCounts.entries()].sort((a, b) => b[1] - a[1]).map(([color, count]) => (
                <label key={color} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={colorFilters.includes(color)} onChange={() => toggle(setColorFilters, color)} style={{ accentColor: "var(--gold)" }} />
                  <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>{color}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{count}</span>
                </label>
              ))}
            </FilterSection>
          )}

          {sexCounts.size > 0 && (
            <FilterSection label="Sex">
              {[...sexCounts.entries()].sort((a, b) => b[1] - a[1]).map(([sex, count]) => (
                <label key={sex} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={sexFilters.includes(sex)} onChange={() => toggle(setSexFilters, sex)} style={{ accentColor: "var(--gold)" }} />
                  <span style={{ fontSize: 13, color: "var(--muted)", flex: 1, textTransform: "capitalize" }}>{sex}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{count}</span>
                </label>
              ))}
            </FilterSection>
          )}

          <FilterSection label="Certifications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
              {CERT_OPTIONS.map((c) => {
                const active = certFilters.includes(c);
                return (
                  <span
                    key={c}
                    onClick={() => toggle(setCertFilters, c)}
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      border: "0.5px solid var(--border-gold)",
                      color: active ? "var(--black)" : "var(--gold)",
                      background: active ? "var(--gold)" : "transparent",
                      borderRadius: "var(--radius-pill)",
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </span>
                );
              })}
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
            <select style={{ background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--muted)", padding: "8px 14px", fontSize: 12, borderRadius: "var(--radius-sm)", outline: "none" }}>
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
          <div className="browse-grid">
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
                    <Link href={`/birds/${bird.id}`} style={{ display: "block", marginTop: 16, width: "100%", padding: 10, background: "transparent", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--radius-sm)", textAlign: "center", textDecoration: "none", transition: "all 0.2s" }}>
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
