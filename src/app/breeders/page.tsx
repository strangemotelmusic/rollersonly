import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const breeders = [
  { slug: "anderson", name: "James Anderson", loft: "Anderson Elite Loft", location: "DeSoto, TX", initials: "A", tier: "Elite Loft", sales: 48, rating: 4.9, wins: 7, birds: 6, specialties: ["World Cup Line", "NBRC Champion", "Deep Rollers"] },
  { slug: "martinez", name: "Carlos Martinez", loft: "Martinez Champion Loft", location: "Los Angeles, CA", initials: "M", tier: "Elite Loft", sales: 34, rating: 4.8, wins: 5, birds: 4, specialties: ["World Cup Line", "Kit Flyers"] },
  { slug: "sterling", name: "Henrik Sterling", loft: "Sterling Dutch Loft", location: "Amsterdam, NL", initials: "S", tier: "Elite Loft", sales: 29, rating: 4.9, wins: 4, birds: 5, specialties: ["European Lines", "Lavender", "Breeding Pairs"] },
  { slug: "royal-birmingham", name: "William Clarke", loft: "Royal Birmingham Loft", location: "Birmingham, UK", initials: "R", tier: "Elite Loft", sales: 41, rating: 4.7, wins: 3, birds: 8, specialties: ["Heritage Line", "NBRC Champion", "UK Champion"] },
  { slug: "khan", name: "Arif Khan", loft: "Khan Loft", location: "Dallas, TX", initials: "K", tier: "Breeder", sales: 18, rating: 4.8, wins: 2, birds: 3, specialties: ["Verified Pedigree", "Regional Champion"] },
  { slug: "desert", name: "Mike Torres", loft: "Desert Loft", location: "Phoenix, AZ", initials: "D", tier: "Breeder", sales: 22, rating: 4.6, wins: 1, birds: 4, specialties: ["Southwest Line", "Recessive Red"] },
  { slug: "heritage", name: "Tom Wright", loft: "Heritage Birmingham", location: "Memphis, TN", initials: "H", tier: "Breeder", sales: 15, rating: 4.7, wins: 2, birds: 3, specialties: ["Heritage Line", "Blue Bar"] },
  { slug: "pacific", name: "Daniel Nguyen", loft: "Pacific Coast Loft", location: "San Diego, CA", initials: "P", tier: "Breeder", sales: 11, rating: 4.9, wins: 1, birds: 2, specialties: ["West Coast Line", "Health Cert"] },
];

const tierColors: Record<string, { bg: string; color: string }> = {
  "Elite Loft": { bg: "rgba(212,175,55,0.1)", color: "var(--gold)" },
  "Breeder": { bg: "rgba(255,255,255,0.06)", color: "var(--muted)" },
};

export default function BreedersPage() {
  return (
    <>
      <Nav active="/breeders" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HERO */}
        <div style={{ background: "var(--void)", padding: "72px 64px 56px", borderBottom: "0.5px solid var(--border)" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>Verified Lofts</p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 640 }}>
            The World&apos;s Top <em style={{ color: "var(--gold)" }}>Roller Pigeon Breeders</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 540, marginBottom: 32 }}>
            Every loft on RollersOnly is verified. Browse by tier, location, bloodline, and competition record — then bid on their birds with confidence.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/signup" className="btn-gold">Join as a Breeder</Link>
            <Link href="/browse" className="btn-ghost">Browse All Birds</Link>
          </div>
        </div>

        {/* STATS */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderBottom: "0.5px solid var(--border)" }}>
          {[["412", "Verified Lofts"], ["38", "Countries"], ["4.8★", "Avg Rating"], ["100%", "Verified Pedigrees"]].map(([val, label]) => (
            <div key={label} style={{ padding: "28px 40px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "48px 64px 80px" }}>

          {/* FILTER ROW */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["All Tiers", "Elite Loft", "Breeder"].map((f, i) => (
                <button key={f} style={{ padding: "8px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: i === 0 ? "var(--gold)" : "transparent", color: i === 0 ? "var(--black)" : "var(--muted)", border: `0.5px solid ${i === 0 ? "var(--gold)" : "var(--border)"}`, borderRadius: 2, cursor: "pointer" }}>{f}</button>
              ))}
            </div>
            <select style={{ background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--muted)", padding: "8px 14px", fontSize: 12, borderRadius: 2, outline: "none" }}>
              <option>Sort: Top Rated</option>
              <option>Sort: Most Sales</option>
              <option>Sort: Most Wins</option>
              <option>Sort: Recently Active</option>
            </select>
          </div>

          {/* BREEDERS GRID */}
          <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "var(--border)" }}>
            {breeders.map((b) => {
              const tc = tierColors[b.tier];
              return (
                <div key={b.slug} style={{ background: "var(--surface)", padding: "28px 32px", cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--void)", border: "1px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--gold)", flexShrink: 0 }}>{b.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)" }}>{b.loft}</div>
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 1, background: tc.bg, color: tc.color }}>
                          {b.tier === "Elite Loft" ? "◆ " : ""}{b.tier}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{b.name} · {b.location}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                        {b.specialties.map((s) => <span key={s} className="tag" style={{ fontSize: 9 }}>{s}</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                    {[
                      [b.sales, "Sales"],
                      [`${b.rating}★`, "Rating"],
                      [b.wins, "Wins"],
                      [b.birds, "Listings"],
                    ].map(([val, label]) => (
                      <div key={String(label)} style={{ padding: "12px 0", textAlign: "center", borderRight: "0.5px solid var(--border)" }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--white)", lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/loft/${b.slug}`} style={{ flex: 1, padding: "10px", textAlign: "center", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderRadius: 1 }}>View Loft</Link>
                    <Link href="/browse" style={{ padding: "10px 16px", border: "0.5px solid var(--border)", color: "var(--muted)", fontSize: 11, textDecoration: "none", borderRadius: 1 }}>Browse Birds →</Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BECOME A BREEDER */}
          <div style={{ marginTop: 64, background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: "40px 48px", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>List Your Loft on RollersOnly</div>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>Reach buyers in 38+ countries. Verified pedigrees. Escrow-protected sales. Starting at $49/mo.</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost">Talk to Us</a>
              <Link href="/signup" className="btn-gold">Become a Partner</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
