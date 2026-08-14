import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const kitLeaders = [
  { rank: 1, loft: "Schoening Loft", breeder: "Rick Schoening", location: "Montana, USA", score: 98.1, kitSize: 13, competition: "NBRC World Cup 2024", badge: "World Cup Champion" },
  { rank: 2, loft: "Glenn Loft", breeder: "Gabe Glenn", location: "Ohio, USA", score: 97.4, kitSize: 15, competition: "NBRC World Cup 2024", badge: "Runner-Up" },
  { rank: 3, loft: "Whelan Loft", breeder: "Brendan Whelan", location: "Ireland", score: 96.8, kitSize: 11, competition: "NBRC World Cup 2024", badge: null },
  { rank: 4, loft: "Deacon Loft", breeder: "Darren Deacon", location: "Midlands, UK", score: 96.2, kitSize: 14, competition: "NBRC World Cup 2024", badge: null },
  { rank: 5, loft: "Silvey Loft", breeder: "Willie Silvey", location: "Central Region, USA", score: 95.9, kitSize: 12, competition: "NBRC World Cup 2024", badge: null },
  { rank: 6, loft: "Rossouw Loft", breeder: "Hannes Rossouw", location: "Free State, South Africa", score: 95.3, kitSize: 10, competition: "NBRC World Cup 2024", badge: null },
  { rank: 7, loft: "Pejcic Loft", breeder: "Vukasin Pejcic", location: "Serbia", score: 94.8, kitSize: 13, competition: "NBRC World Cup 2024", badge: null },
  { rank: 8, loft: "Aldea Loft", breeder: "Mihai Aldea", location: "Romania", score: 94.1, kitSize: 11, competition: "NBRC World Cup 2024", badge: null },
];

const competitions = [
  { name: "NBRC World Cup 2025", date: "October 2025", location: "Tulsa, OK", status: "upcoming", entries: 0 },
  { name: "Southwest Regional 2025", date: "July 2025", location: "Phoenix, AZ", status: "upcoming", entries: 24 },
  { name: "Texas State Championship 2025", date: "June 2025", location: "DeSoto, TX", status: "open", entries: 31 },
  { name: "NBRC World Cup 2024", date: "October 2024", location: "Tulsa, OK", status: "completed", entries: 148 },
];

const topBreeders = [
  { rank: 1, name: "Rick Schoening", loft: "Schoening Loft", points: 2480, wins: 7, country: "USA" },
  { rank: 2, name: "Gabe Glenn", loft: "Glenn Loft", points: 2210, wins: 5, country: "USA" },
  { rank: 3, name: "Brendan Whelan", loft: "Whelan Loft", points: 1980, wins: 4, country: "IRL" },
  { rank: 4, name: "Darren Deacon", loft: "Deacon Loft", points: 1740, wins: 3, country: "UK" },
  { rank: 5, name: "Willie Silvey", loft: "Silvey Loft", points: 1520, wins: 2, country: "USA" },
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
            The Official <em style={{ color: "var(--gold)" }}>Rankings</em> for Competitive Roller Flying
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 580, marginBottom: 32 }}>
            Scores, standings, and competition records from NBRC World Cup events, regional championships, and sanctioned club competitions worldwide.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/signup" className="btn-gold">Register Your Loft</Link>
            <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost">Submit Competition Results</a>
          </div>
        </div>

        {/* STATS */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)" }}>
          {[["148", "World Cup Entries 2024"], ["42", "Countries Represented"], ["98.1", "Top Score 2024"], ["7", "Schoening Wins (All-Time)"]].map(([val, label]) => (
            <div key={label} style={{ padding: "36px 48px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 44, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 8 }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="rs-2col-b rs-pad-lg" style={{ display: "grid", gridTemplateColumns: "1fr 320px", padding: "64px", gap: 48, alignItems: "start" }}>
          <div>

            {/* COMPETITION TABS */}
            <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid var(--border)", marginBottom: 32 }}>
              {["NBRC World Cup 2024", "Southwest Regional", "Texas State", "All-Time"].map((tab, i) => (
                <button key={tab} style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: "none", borderBottom: i === 0 ? "2px solid var(--gold)" : "none", color: i === 0 ? "var(--gold)" : "var(--muted)", cursor: "pointer", marginBottom: -1 }}>{tab}</button>
              ))}
            </div>

            {/* KIT LEADERBOARD */}
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 300, color: "var(--white)" }}>Kit Flying — NBRC World Cup 2024</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>148 entries · Tulsa, OK</div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                    {["Rank", "Loft / Breeder", "Location", "Kit", "Score", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kitLeaders.map((entry) => (
                    <tr key={entry.rank} style={{ borderBottom: "0.5px solid var(--border)", background: entry.rank <= 3 ? "rgba(212,175,55,0.02)" : "transparent" }}>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: entry.rank <= 3 ? 28 : 22, fontWeight: 300, color: entry.rank === 1 ? "var(--gold)" : entry.rank <= 3 ? "var(--white)" : "var(--muted)", lineHeight: 1 }}>{entry.rank}</div>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{entry.loft}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{entry.breeder}</div>
                        {entry.badge && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", border: "0.5px solid var(--border-gold)", padding: "2px 8px", borderRadius: 1, display: "inline-block", marginTop: 4 }}>◆ {entry.badge}</span>}
                      </td>
                      <td style={{ padding: "18px 12px", fontSize: 12, color: "var(--muted)" }}>{entry.location}</td>
                      <td style={{ padding: "18px 12px", fontSize: 13, color: "var(--muted)" }}>{entry.kitSize} birds</td>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: entry.rank === 1 ? "var(--gold)" : "var(--white)" }}>{entry.score}</div>
                        <div style={{ height: 3, background: "var(--border)", borderRadius: 1, marginTop: 4, maxWidth: 80, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: entry.rank === 1 ? "var(--gold)" : "var(--muted)", width: `${entry.score}%` }} />
                        </div>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <Link href={`/loft/${entry.loft.split(" ")[0].toLowerCase()}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none" }}>Profile →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ALL-TIME POINTS */}
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 300, color: "var(--white)", marginBottom: 20 }}>All-Time Points Leaders</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
                {topBreeders.map((b) => (
                  <div key={b.rank} style={{ background: "var(--surface)", display: "flex", alignItems: "center", gap: 20, padding: "20px 24px" }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: b.rank === 1 ? "var(--gold)" : "var(--muted)", minWidth: 48 }}>{b.rank}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.loft} · {b.country}</div>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 80 }}>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, color: "var(--white)" }}>{b.wins}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Wins</div>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 100 }}>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, color: b.rank === 1 ? "var(--gold)" : "var(--white)" }}>{b.points.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>◆ Upcoming</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>NBRC World Cup 2025</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>October 2025 · Tulsa, OK. Registration opens July 1. Elite Loft members receive priority entry.</p>
              <Link href="/signup" className="btn-gold" style={{ display: "block", textAlign: "center", padding: 12 }}>Pre-Register Your Kit</Link>
            </div>

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Competition Schedule</div>
              {competitions.map((c, i) => (
                <div key={i} style={{ padding: "14px 0", borderBottom: i < competitions.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, color: "var(--white)" }}>{c.name}</div>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 1, background: c.status === "open" ? "rgba(212,175,55,0.15)" : c.status === "completed" ? "rgba(255,255,255,0.06)" : "rgba(50,200,100,0.1)", color: c.status === "open" ? "var(--gold)" : c.status === "completed" ? "var(--muted)" : "#50c878" }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.date} · {c.location}</div>
                  {c.entries > 0 && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{c.entries} entries</div>}
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
