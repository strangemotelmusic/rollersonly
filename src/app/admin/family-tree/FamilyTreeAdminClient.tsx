"use client";

import { useMemo, useState } from "react";
import { deleteFamilyTreeBird, deleteFamilyTreePair } from "@/app/actions/family-tree-admin";

type Stats = {
  totalBirds: number;
  uniqueBreeders: number;
  totalSeasons: number;
  totalPairs: number;
  totalFlyLog: number;
  tierCounts: { fancier: number; breeder: number; elite: number; other: number };
};

type BirdRow = {
  id: string;
  name: string | null;
  ringNumber: string | null;
  sex: string | null;
  color: string | null;
  birthYear: number | null;
  createdAt: string;
  ownerName: string;
  sireName: string;
  damName: string;
};

type PairRow = {
  id: string;
  seasonLabel: string;
  ownerName: string;
  sireName: string;
  damName: string;
  pairedAt: string | null;
  eggCount: number;
  hatchedCount: number;
  status: string;
};

const card: React.CSSProperties = { background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20 };
const statLabel: React.CSSProperties = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 };
const statValue: React.CSSProperties = { fontSize: 28, fontWeight: 300, fontFamily: "var(--ff-display)", color: "var(--white)" };
const th: React.CSSProperties = { textAlign: "left", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", padding: "10px 12px", borderBottom: "0.5px solid var(--border)" };
const td: React.CSSProperties = { fontSize: 13, color: "var(--white)", padding: "10px 12px", borderBottom: "0.5px solid var(--border)" };
const deleteBtn: React.CSSProperties = { background: "transparent", border: "0.5px solid var(--border)", color: "var(--muted)", borderRadius: 2, padding: "4px 10px", fontSize: 12, cursor: "pointer" };

export default function FamilyTreeAdminClient({
  stats,
  initialBirds,
  initialPairs,
}: {
  stats: Stats;
  initialBirds: BirdRow[];
  initialPairs: PairRow[];
}) {
  const [tab, setTab] = useState<"birds" | "pairs">("birds");
  const [birds, setBirds] = useState(initialBirds);
  const [pairs, setPairs] = useState(initialPairs);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredBirds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return birds;
    return birds.filter(
      (b) =>
        (b.name || "").toLowerCase().includes(q) ||
        (b.ringNumber || "").toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q)
    );
  }, [birds, query]);

  async function handleDeleteBird(id: string) {
    if (!confirm("Delete this bird from Family Tree? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    const result = await deleteFamilyTreeBird(id);
    setBusyId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setBirds((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleDeletePair(id: string) {
    if (!confirm("Delete this breeding pair? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    const result = await deleteFamilyTreePair(id);
    setBusyId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPairs((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 32 }}>
        <div style={card}>
          <div style={statLabel}>Birds Registered</div>
          <div style={statValue}>{stats.totalBirds}</div>
        </div>
        <div style={card}>
          <div style={statLabel}>Active Breeders</div>
          <div style={statValue}>{stats.uniqueBreeders}</div>
        </div>
        <div style={card}>
          <div style={statLabel}>Seasons</div>
          <div style={statValue}>{stats.totalSeasons}</div>
        </div>
        <div style={card}>
          <div style={statLabel}>Breeding Pairs</div>
          <div style={statValue}>{stats.totalPairs}</div>
        </div>
        <div style={card}>
          <div style={statLabel}>Fly Log Entries</div>
          <div style={statValue}>{stats.totalFlyLog}</div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 32, display: "flex", gap: 24 }}>
        <div>
          <div style={statLabel}>Fancier</div>
          <div style={{ fontSize: 18, color: "var(--white)" }}>{stats.tierCounts.fancier}</div>
        </div>
        <div>
          <div style={statLabel}>Breeder</div>
          <div style={{ fontSize: 18, color: "var(--white)" }}>{stats.tierCounts.breeder}</div>
        </div>
        <div>
          <div style={statLabel}>Elite</div>
          <div style={{ fontSize: 18, color: "var(--white)" }}>{stats.tierCounts.elite}</div>
        </div>
        {stats.tierCounts.other > 0 && (
          <div>
            <div style={statLabel}>Other / Admin</div>
            <div style={{ fontSize: 18, color: "var(--white)" }}>{stats.tierCounts.other}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab("birds")}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            borderRadius: 2,
            cursor: "pointer",
            background: tab === "birds" ? "var(--gold)" : "transparent",
            color: tab === "birds" ? "var(--black)" : "var(--muted)",
            border: "0.5px solid var(--border)",
          }}
        >
          Birds
        </button>
        <button
          onClick={() => setTab("pairs")}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            borderRadius: 2,
            cursor: "pointer",
            background: tab === "pairs" ? "var(--gold)" : "transparent",
            color: tab === "pairs" ? "var(--black)" : "var(--muted)",
            border: "0.5px solid var(--border)",
          }}
        >
          Breeding Pairs
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 14 }}>{error}</p>}

      {tab === "birds" && (
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ring number, or owner…"
            style={{
              width: "100%",
              maxWidth: 360,
              background: "var(--black)",
              border: "0.5px solid var(--border)",
              color: "var(--white)",
              padding: "9px 12px",
              fontSize: 13,
              borderRadius: 2,
              outline: "none",
              marginBottom: 16,
            }}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Bird</th>
                  <th style={th}>Owner</th>
                  <th style={th}>Sire</th>
                  <th style={th}>Dam</th>
                  <th style={th}>Sex</th>
                  <th style={th}>Registered</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {filteredBirds.length === 0 && (
                  <tr>
                    <td style={td} colSpan={7}>
                      No birds match.
                    </td>
                  </tr>
                )}
                {filteredBirds.map((b) => (
                  <tr key={b.id}>
                    <td style={td}>
                      {b.name || "Unnamed"} {b.ringNumber && <span style={{ color: "var(--muted)" }}>· {b.ringNumber}</span>}
                    </td>
                    <td style={td}>{b.ownerName}</td>
                    <td style={td}>{b.sireName}</td>
                    <td style={td}>{b.damName}</td>
                    <td style={td}>{b.sex || "—"}</td>
                    <td style={td}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td style={td}>
                      <button style={deleteBtn} disabled={busyId === b.id} onClick={() => handleDeleteBird(b.id)}>
                        {busyId === b.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "pairs" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Season</th>
                <th style={th}>Owner</th>
                <th style={th}>Sire</th>
                <th style={th}>Dam</th>
                <th style={th}>Eggs</th>
                <th style={th}>Hatched</th>
                <th style={th}>Status</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {pairs.length === 0 && (
                <tr>
                  <td style={td} colSpan={8}>
                    No breeding pairs yet.
                  </td>
                </tr>
              )}
              {pairs.map((p) => (
                <tr key={p.id}>
                  <td style={td}>{p.seasonLabel}</td>
                  <td style={td}>{p.ownerName}</td>
                  <td style={td}>{p.sireName}</td>
                  <td style={td}>{p.damName}</td>
                  <td style={td}>{p.eggCount}</td>
                  <td style={td}>{p.hatchedCount}</td>
                  <td style={td}>{p.status}</td>
                  <td style={td}>
                    <button style={deleteBtn} disabled={busyId === p.id} onClick={() => handleDeletePair(p.id)}>
                      {busyId === p.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
