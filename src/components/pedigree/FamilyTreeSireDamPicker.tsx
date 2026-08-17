"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildPedigreeSelectQuery, findSharedAncestors, birdLabel, type PedigreeNode, type SharedAncestor } from "@/lib/pedigree/tree";

export type BirdOption = { id: string; name: string | null; ring_number: string | null; sex: string | null };

const INBREEDING_CHECK_GENERATIONS = 4;

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--deep)",
  border: "0.5px solid var(--border)",
  color: "var(--white)",
  padding: "10px 12px",
  fontSize: 13,
  borderRadius: 2,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  display: "block",
  marginBottom: 6,
};

function BirdSearchField({
  label,
  selected,
  onSelect,
  excludeId,
}: {
  label: string;
  selected: BirdOption | null;
  onSelect: (b: BirdOption | null) => void;
  excludeId?: string | null;
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BirdOption[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("family_tree_birds")
        .select("id, name, ring_number, sex")
        .or(`name.ilike.%${query}%,ring_number.ilike.%${query}%`)
        .limit(8);
      setResults((data ?? []).filter((b) => b.id !== excludeId));
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, excludeId]);

  if (selected) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--deep)",
            border: "0.5px solid var(--border-gold)",
            borderRadius: 2,
            padding: "10px 12px",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--white)" }}>{birdLabel(selected)}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or ring number…"
        style={inputStyle}
      />
      {open && query.trim() && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "0.5px solid var(--border-gold)",
            borderRadius: 2,
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {searching && <div style={{ padding: 10, fontSize: 12, color: "var(--muted)" }}>Searching…</div>}
          {!searching && results.length === 0 && <div style={{ padding: 10, fontSize: 12, color: "var(--muted)" }}>No birds found.</div>}
          {results.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                onSelect(b);
                setQuery("");
                setOpen(false);
              }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "none", border: "none", color: "var(--white)", fontSize: 13, cursor: "pointer" }}
            >
              {birdLabel(b)} {b.sex && <span style={{ color: "var(--muted)" }}>({b.sex})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FamilyTreeSireDamPicker({
  sire,
  dam,
  onChangeSire,
  onChangeDam,
  excludeBirdId,
}: {
  sire: BirdOption | null;
  dam: BirdOption | null;
  onChangeSire: (b: BirdOption | null) => void;
  onChangeDam: (b: BirdOption | null) => void;
  excludeBirdId?: string | null;
}) {
  const supabase = createClient();
  const [sharedAncestors, setSharedAncestors] = useState<SharedAncestor[] | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!sire || !dam) {
      setSharedAncestors(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    (async () => {
      const select = buildPedigreeSelectQuery(INBREEDING_CHECK_GENERATIONS);
      const [{ data: sireTree }, { data: damTree }] = await Promise.all([
        supabase.from("family_tree_birds").select(select).eq("id", sire.id).single(),
        supabase.from("family_tree_birds").select(select).eq("id", dam.id).single(),
      ]);
      if (cancelled) return;
      setChecking(false);
      if (!sireTree || !damTree) {
        setSharedAncestors([]);
        return;
      }
      setSharedAncestors(findSharedAncestors(sireTree as unknown as PedigreeNode, damTree as unknown as PedigreeNode));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sire?.id, dam?.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <BirdSearchField label="Sire" selected={sire} onSelect={onChangeSire} excludeId={excludeBirdId} />
        <BirdSearchField label="Dam" selected={dam} onSelect={onChangeDam} excludeId={excludeBirdId} />
      </div>

      {checking && <div style={{ fontSize: 12, color: "var(--muted)" }}>Checking bloodline for shared ancestors…</div>}

      {sharedAncestors && sharedAncestors.length > 0 && (
        <div style={{ background: "rgba(212,175,55,0.08)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 6 }}>⚠ Shared ancestor detected</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            {sharedAncestors.slice(0, 3).map((s) => (
              <div key={s.bird.id}>
                {birdLabel(s.bird)} — {s.sireSideDepth} gen{s.sireSideDepth === 1 ? "" : "s"} back via sire, {s.damSideDepth} gen
                {s.damSideDepth === 1 ? "" : "s"} back via dam
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
