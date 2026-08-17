"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PedigreeTree from "@/components/pedigree/PedigreeTree";
import { buildPedigreeSelectQuery, type PedigreeNode } from "@/lib/pedigree/tree";

type RecentBird = { id: string; name: string; ring: string | null; loft: string; year: number | null; certs: string[] };
type SearchResult = { id: string; name: string | null; ring_number: string | null; sex: string | null; lofts: { name: string } | null };

const FEATURED_GENERATIONS = 4;

export default function PedigreeClient({
  stats,
  recentBirds,
  bloodlineLofts,
  featuredBird,
}: {
  stats: { registered: number; lofts: number; connections: number; certified: number };
  recentBirds: RecentBird[];
  bloodlineLofts: string[];
  featuredBird: { root: PedigreeNode; loftName: string | null } | null;
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState(featuredBird);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loftFilter, setLoftFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoftFilter(null);
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("birds")
        .select("id, name, ring_number, sex, lofts(name)")
        .or(`name.ilike.%${query}%,ring_number.ilike.%${query}%`)
        .limit(8);
      setResults((data ?? []) as unknown as SearchResult[]);
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, supabase]);

  async function searchByLoftName(loftName: string) {
    setQuery("");
    setLoftFilter(loftName);
    setSearching(true);
    const { data: loft } = await supabase.from("lofts").select("id").eq("name", loftName).maybeSingle();
    if (!loft) {
      setResults([]);
      setSearching(false);
      return;
    }
    const { data } = await supabase.from("birds").select("id, name, ring_number, sex, lofts(name)").eq("loft_id", loft.id).limit(20);
    setResults((data ?? []) as unknown as SearchResult[]);
    setSearching(false);
  }

  async function selectBird(birdId: string) {
    setLoadingTree(true);
    setQuery("");
    setLoftFilter(null);
    setResults([]);
    const select = buildPedigreeSelectQuery(FEATURED_GENERATIONS);
    const { data } = await supabase.from("birds").select(`${select}, lofts(name)`).eq("id", birdId).single();
    setLoadingTree(false);
    if (data) {
      setSelected({ root: data as unknown as PedigreeNode, loftName: (data as { lofts?: { name: string } | null }).lofts?.name ?? null });
    }
  }

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      {/* HERO */}
      <div style={{ background: "var(--void)", padding: "80px 64px", position: "relative" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>
          Pedigree Vault — Registry &amp; Bloodline Archive
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 20, maxWidth: 700 }}>
          The RollersOnly <em style={{ color: "var(--gold)" }}>Pedigree Registry</em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620, marginBottom: 48 }}>
          Every registered bird carries a real, verifiable sire/dam bloodline chain — searchable, viewable as a full family
          tree, and exportable as a PDF you can print or send to anyone in seconds.
        </p>

        <div style={{ display: "flex", gap: 12, maxWidth: 700, position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ring number or bird name…"
            style={{ flex: 1, background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "14px 20px", fontSize: 14, borderRadius: 2, outline: "none" }}
          />
          {(searching || results.length > 0) && (query.trim() || loftFilter) && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, maxHeight: 280, overflowY: "auto", zIndex: 20 }}>
              {loftFilter && <div style={{ padding: "10px 18px", fontSize: 11, color: "var(--gold)", borderBottom: "0.5px solid var(--border)" }}>Birds from {loftFilter}</div>}
              {searching && <div style={{ padding: 14, fontSize: 12, color: "var(--muted)" }}>Searching…</div>}
              {!searching && results.length === 0 && <div style={{ padding: 14, fontSize: 12, color: "var(--muted)" }}>No birds found.</div>}
              {results.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBird(b.id)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 18px", background: "none", border: "none", borderBottom: "0.5px solid var(--border)", color: "var(--white)", fontSize: 13, cursor: "pointer" }}
                >
                  {b.name || "Unnamed bird"} {b.ring_number && <span style={{ color: "var(--gold)" }}>· {b.ring_number}</span>}
                  <span style={{ color: "var(--muted)" }}> — {b.lofts?.name || "Independent"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", background: "var(--surface)" }}>
        {[
          [stats.registered.toLocaleString(), "Birds registered"],
          [stats.lofts.toLocaleString(), "Lofts on RollersOnly"],
          [stats.connections.toLocaleString(), "Pedigree connections"],
          [stats.certified.toLocaleString(), "RollersOnly Certified"],
        ].map(([val, label]) => (
          <div key={label} style={{ padding: "40px 48px", borderRight: "0.5px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 48, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 8 }}>{val}</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* BODY */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, padding: "64px", alignItems: "start" }}>
        <div style={{ paddingRight: 64 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)" }}>Recently Registered Birds</div>
            <Link href="/browse" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>Browse full registry →</Link>
          </div>

          {recentBirds.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>No birds registered yet — be the first.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                  {["Bird / Ring Number", "Loft", "Year", "Certifications", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBirds.map((bird) => (
                  <tr key={bird.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{bird.name}</div>
                      {bird.ring && <div style={{ fontSize: 11, color: "var(--gold)" }}>{bird.ring}</div>}
                    </td>
                    <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{bird.loft}</td>
                    <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{bird.year || "—"}</td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {bird.certs.length === 0 ? <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span> : bird.certs.map((c) => <span key={c} className="tag" style={{ fontSize: 9 }}>{c}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <button onClick={() => selectBird(bird.id)} style={{ background: "none", border: "none", fontSize: 11, color: "var(--gold)", cursor: "pointer", padding: 0 }}>
                        View Pedigree →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* PEDIGREE TREE */}
          <div style={{ marginTop: 64 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
                {selected ? "Bloodline Tree" : "No Featured Bloodline Yet"}
              </div>
              {selected && (
                <Link href={`/birds/${selected.root.id}`} style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
                  Full profile, download &amp; share →
                </Link>
              )}
            </div>

            {loadingTree && <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading pedigree…</p>}
            {!loadingTree && selected && <PedigreeTree root={selected.root} />}
            {!loadingTree && !selected && (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                No birds with recorded sire/dam bloodlines yet. Register a bird and add its parents to see the first tree here.
              </p>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div>
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", padding: 28, borderRadius: 2, marginBottom: 24 }}>
            <div style={{ fontSize: 24, color: "var(--gold)", marginBottom: 12 }}>◆</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Add Your Bird to the Vault</div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
              Every subscriber can register birds and build real bloodline records — no listing required.
            </p>
            <Link href="/dashboard/loft" className="btn-gold" style={{ display: "block", textAlign: "center", padding: 12 }}>Register a Bird</Link>
          </div>

          {bloodlineLofts.length > 0 && (
            <div style={{ background: "var(--void)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Notable Lofts</div>
              {bloodlineLofts.map((name) => (
                <div
                  key={name}
                  onClick={() => searchByLoftName(name)}
                  style={{ padding: "10px 0", borderBottom: "0.5px solid var(--border)", fontSize: 13, color: "var(--muted)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                >
                  {name} <span style={{ color: "var(--gold)" }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
