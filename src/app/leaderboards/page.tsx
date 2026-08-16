import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// 2026 World Cup Championship — The World's Top Ten (official order).
// Source: Decade of the Spinner, Championship Issue. Q = Quality, D = Depth.
const topTen = [
  { rank: 1, flyer: "Rick Schoening", location: "United States · Montana", quality: 1.5, depth: 1.5, badge: "World Champion" },
  { rank: 2, flyer: "Gabe Glenn", location: "United States · Ohio", quality: 1.5, depth: 1.4, badge: null },
  { rank: 3, flyer: "Alex Guerrero", location: "United States · S. Central California", quality: 1.4, depth: 1.4, badge: null },
  { rank: 4, flyer: "Jeff DeWitt", location: "United States · Kentucky", quality: 1.4, depth: 1.4, badge: null },
  { rank: 5, flyer: "Brendan Whelan", location: "Republic of Ireland", quality: 1.3, depth: 1.4, badge: null },
  { rank: 6, flyer: "Darren Deacon", location: "United Kingdom · Midlands", quality: 1.5, depth: 1.5, badge: null },
  { rank: 7, flyer: "Vukasin Pejcic", location: "Serbia", quality: 1.4, depth: 1.4, badge: null },
  { rank: 8, flyer: "Mihai Aldea", location: "Romania", quality: 1.4, depth: 1.4, badge: null },
  { rank: 9, flyer: "Willie Silvey", location: "United States · Central Region", quality: 1.3, depth: 1.4, badge: null },
  { rank: 10, flyer: "Hannes Rossouw", location: "South Africa · Free State", quality: 1.5, depth: 1.5, badge: null },
];

// World Cup Roll of Honor — recent champions (2010–2026).
// Source: Decade of the Spinner, Championship Issue, World Cup History.
const rollOfHonor = [
  { year: 2026, name: "Rick Schoening", country: "United States", reigning: true },
  { year: 2025, name: "Riaan Kruger", country: "South Africa" },
  { year: 2024, name: "Hannes Rossouw", country: "South Africa" },
  { year: 2023, name: "Anthony Robinson", country: "Republic of Ireland" },
  { year: 2019, name: "Tony Hatoum", country: "Canada" },
  { year: 2018, name: "Razaak Sahabodien", country: "South Africa" },
  { year: 2017, name: "Edgar Roscoe", country: "South Africa" },
  { year: 2016, name: "Sparks Axsel", country: "South Africa" },
  { year: 2015, name: "Theodore Mann", country: "United States" },
  { year: 2014, name: "Keith Story", country: "United Kingdom" },
  { year: 2013, name: "Heine Bijker", country: "Netherlands" },
  { year: 2012, name: "Austin Fox", country: "Republic of Ireland" },
  { year: 2011, name: "Kevin McKinney", country: "United Kingdom" },
  { year: 2010, name: "Eric Laidler", country: "Denmark" },
];

const legends = [
  { name: "Heine Bijker", titles: "Four-Time Champion", years: "1999 · 2001 · 2007 · 2013" },
  { name: "Monty Neibel", titles: "Three-Time Champion", years: "1991 · 1998 · 2000" },
];

const schedule = [
  { name: "World Cup 2027", date: "October 2027", location: "Host TBA", status: "upcoming" },
  { name: "World Cup 2026", date: "October 2026", location: "Champion: Rick Schoening", status: "completed" },
];

export default function LeaderboardsPage() {
  return (
    <>
      <Nav active="/leaderboards" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HERO */}
        <div style={{ background: "var(--void)", padding: "72px 64px 56px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>Competition Leaderboards</p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 680 }}>
            The 2026 World Cup <em style={{ color: "var(--gold)" }}>Top Ten</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 580, marginBottom: 32 }}>
            The official standings for competitive roller flying — the world&apos;s finest kits, ranked on quality and depth, plus the full World Cup Roll of Honor.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/signup" className="btn-gold">Register Your Loft</Link>
            <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost">Submit Competition Results</a>
          </div>
        </div>

        {/* STATS */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)" }}>
          {[["10", "2026 Top Ten Flyers"], ["6", "Countries in the Top Ten"], ["1.5 / 1.5", "Champion Quality / Depth"], ["4", "Most Titles (Heine Bijker)"]].map(([val, label]) => (
            <div key={label} style={{ padding: "36px 48px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 44, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 8 }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="rs-2col-b rs-pad-lg" style={{ display: "grid", gridTemplateColumns: "1fr 320px", padding: "64px", gap: 48, alignItems: "start" }}>
          <div>

            {/* TOP TEN LEADERBOARD */}
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 300, color: "var(--white)" }}>World Cup 2026 — The World&apos;s Top Ten</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Reigning champion · Rick Schoening</div>
              </div>

              <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                    {["Rank", "Flyer", "Country / Region", "Quality", "Depth"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topTen.map((entry) => (
                    <tr key={entry.rank} style={{ borderBottom: "0.5px solid var(--border)", background: entry.rank === 1 ? "rgba(212,175,55,0.04)" : entry.rank <= 3 ? "rgba(212,175,55,0.02)" : "transparent" }}>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: entry.rank <= 3 ? 28 : 22, fontWeight: 300, color: entry.rank === 1 ? "var(--gold)" : entry.rank <= 3 ? "var(--white)" : "var(--muted)", lineHeight: 1 }}>{String(entry.rank).padStart(2, "0")}</div>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{entry.flyer}</div>
                        {entry.badge && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", border: "0.5px solid var(--border-gold)", padding: "2px 8px", borderRadius: 1, display: "inline-block", marginTop: 4 }}>◆ {entry.badge}</span>}
                      </td>
                      <td style={{ padding: "18px 12px", fontSize: 12, color: "var(--muted)" }}>{entry.location}</td>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: entry.rank === 1 ? "var(--gold)" : "var(--white)" }}>{entry.quality.toFixed(1)}</div>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: entry.rank === 1 ? "var(--gold)" : "var(--white)" }}>{entry.depth.toFixed(1)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* ROLL OF HONOR */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 300, color: "var(--white)" }}>World Cup Roll of Honor</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Champions who made the sky remember</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", marginBottom: 40 }}>
                {rollOfHonor.map((c) => (
                  <div key={c.year} style={{ background: c.reigning ? "rgba(212,175,55,0.05)" : "var(--surface)", display: "flex", alignItems: "center", gap: 20, padding: "16px 24px", borderLeft: c.reigning ? "2px solid var(--gold)" : "2px solid transparent" }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 300, color: c.reigning ? "var(--gold)" : "var(--muted)", minWidth: 72 }}>{c.year}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "var(--white)" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.country}</div>
                    </div>
                    {c.reigning && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", border: "0.5px solid var(--border-gold)", padding: "3px 10px", borderRadius: 1 }}>◆ Reigning Champion</span>}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>The Legends With More Than One Crown</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
                {legends.map((l) => (
                  <div key={l.name} style={{ background: "var(--surface)", padding: "22px 24px" }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>{l.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>{l.titles}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{l.years}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>◆ Reigning Champion</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Rick Schoening</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>2026 World Cup Champion · United States, Montana. Top marks on both quality and depth (1.5 / 1.5).</p>
              <Link href="/our-breeders" className="btn-gold" style={{ display: "block", textAlign: "center", padding: 12 }}>See the Bloodlines</Link>
            </div>

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Competition Schedule</div>
              {schedule.map((c, i) => (
                <div key={i} style={{ padding: "14px 0", borderBottom: i < schedule.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, color: "var(--white)" }}>{c.name}</div>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 1, background: c.status === "completed" ? "rgba(255,255,255,0.06)" : "rgba(50,200,100,0.1)", color: c.status === "completed" ? "var(--muted)" : "#50c878" }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.date} · {c.location}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>Submit Your Score</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>Are you a club secretary or competition organizer? Submit official results to be posted on the leaderboard.</p>
              <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost" style={{ display: "block", textAlign: "center", padding: "10px", fontSize: 11 }}>Submit Results →</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
