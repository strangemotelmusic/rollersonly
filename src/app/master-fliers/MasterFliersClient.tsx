"use client";

import { useMemo, useState } from "react";

type Flier = {
  id: string;
  rank: number | null;
  name: string;
  location: string | null;
  deceased: boolean;
  year_awarded: number | null;
  points: number | null;
};

const PAGE_SIZE = 50;

export default function MasterFliersClient({ fliers }: { fliers: Flier[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fliers;
    return fliers.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.location ?? "").toLowerCase().includes(q)
    );
  }, [fliers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  const lifetimeCount = fliers.filter((f) => (f.points ?? 0) >= 1500).length;

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      {/* HERO */}
      <div style={{ background: "var(--void)", padding: "72px 64px 56px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
          NBRC Master Flier Ranking
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 720 }}>
          The National Birmingham Roller Club <em style={{ color: "var(--gold)" }}>Master Fliers</em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 640, marginBottom: 8 }}>
          The Master Flier Award is earned through points accumulated in tough competition over years of dedication to
          flying Birmingham Rollers. The Lifetime Master Flyer Award requires 1,500 Master Flyer points, with at least
          750 earned in NBRC-regulated competition — a mark only a handful of flyers in the world have ever reached.
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Official data from the{" "}
          <a href="https://nbrc.us/master-flier-ranking-1/" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>
            National Birmingham Roller Club
          </a>
          .
        </p>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)" }}>
        {[
          [fliers.length.toLocaleString(), "Ranked Master Fliers"],
          [lifetimeCount.toString(), "1,500+ Point Lifetime Masters"],
          [fliers[0]?.name ?? "—", "All-Time Points Leader"],
        ].map(([val, label]) => (
          <div key={label} style={{ padding: "36px 48px", borderRight: "0.5px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--white)", lineHeight: 1.1, marginBottom: 8 }}>{val}</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "48px 64px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
            Full Ranking
          </div>
          <input
            type="text"
            placeholder="Search by name or location…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 2,
              padding: "10px 16px",
              fontSize: 13,
              color: "var(--white)",
              minWidth: 260,
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                {["Rank", "Flyer", "Location", "Year Awarded", "Points"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((f) => (
                <tr key={f.id} style={{ borderBottom: "0.5px solid var(--border)", background: (f.rank ?? 0) <= 3 ? "rgba(212,175,55,0.03)" : "transparent" }}>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 300, color: (f.rank ?? 0) <= 3 ? "var(--gold)" : "var(--muted)" }}>
                      {f.rank ?? "—"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "var(--white)" }}>
                    {f.name}
                    {f.deceased && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8 }}>(deceased)</span>}
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 12, color: "var(--muted)" }}>{f.location ?? "—"}</td>
                  <td style={{ padding: "14px 12px", fontSize: 12, color: "var(--muted)" }}>{f.year_awarded ?? "—"}</td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "var(--white)" }}>
                    {f.points != null ? f.points.toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 12px", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
                    No flyers match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 32 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
              className="btn-ghost"
              style={{ padding: "8px 18px", opacity: clampedPage <= 1 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Page {clampedPage} of {totalPages} · {filtered.length.toLocaleString()} flyers
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
              className="btn-ghost"
              style={{ padding: "8px 18px", opacity: clampedPage >= totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
