"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FamilyTreeSireDamPicker, { type BirdOption } from "@/components/pedigree/FamilyTreeSireDamPicker";
import { createSeason, createBreedingPair, updatePairStats, deleteBreedingPair } from "@/lib/family-tree/breeding";

type MiniBird = { id: string; name: string | null; ring_number: string | null } | null;

export type Pair = {
  id: string;
  sire_id: string;
  dam_id: string;
  paired_at: string | null;
  egg_count: number;
  hatched_count: number;
  status: string;
  notes: string | null;
  sire: MiniBird;
  dam: MiniBird;
};

export type Season = {
  id: string;
  label: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  family_tree_pairs: Pair[];
};

const inputStyle: React.CSSProperties = { width: "100%", background: "#0A0D12", border: "1px solid #1C232E", color: "#E8EDF3", padding: "10px 12px", fontSize: 13, borderRadius: 4, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5B6675", display: "block", marginBottom: 6 };
const card: React.CSSProperties = { background: "#0D1117", border: "1px solid #1C232E", borderRadius: 6, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#2DD4BF", color: "#0A0D12", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, borderRadius: 4, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "#C7D0DB", border: "1px solid #1C232E", padding: "9px 18px", fontSize: 13, borderRadius: 4, cursor: "pointer" };

function miniLabel(b: MiniBird): string {
  if (!b) return "Unrecorded";
  return b.name || b.ring_number || "Unnamed";
}

export default function BreedingClient({ ownerId, initialSeasons }: { ownerId: string; initialSeasons: Season[] }) {
  const supabase = createClient();
  const [seasons, setSeasons] = useState(initialSeasons);
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateSeason() {
    if (!label.trim()) {
      setError("Season label is required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await createSeason(supabase, { ownerId, label, startDate: startDate || null, endDate: endDate || null, notes: null });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSeasons((prev) => [{ id: result.seasonId, label, start_date: startDate || null, end_date: endDate || null, notes: null, family_tree_pairs: [] }, ...prev]);
    setShowNewSeason(false);
    setLabel("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#5B6675" }}>{seasons.length} season{seasons.length === 1 ? "" : "s"}</div>
        <button style={btnPrimary} onClick={() => setShowNewSeason((s) => !s)}>{showNewSeason ? "Cancel" : "+ New Season"}</button>
      </div>

      {showNewSeason && (
        <div style={{ ...card, marginBottom: 24, border: "1px solid #2DD4BF" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2027 Spring Round" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 10 }}>{error}</p>}
          <button style={btnPrimary} onClick={handleCreateSeason} disabled={saving}>{saving ? "Creating…" : "Create Season"}</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {seasons.length === 0 && !showNewSeason && <p style={{ fontSize: 13, color: "#5B6675" }}>No breeding seasons yet.</p>}
        {seasons.map((season) => (
          <SeasonCard key={season.id} ownerId={ownerId} season={season} setSeasons={setSeasons} />
        ))}
      </div>
    </div>
  );
}

function SeasonCard({ ownerId, season, setSeasons }: { ownerId: string; season: Season; setSeasons: (fn: (prev: Season[]) => Season[]) => void }) {
  const supabase = createClient();
  const [showAddPair, setShowAddPair] = useState(false);
  const [sire, setSire] = useState<BirdOption | null>(null);
  const [dam, setDam] = useState<BirdOption | null>(null);
  const [pairedAt, setPairedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updatePairInState(pairId: string, patch: Partial<Pair>) {
    setSeasons((prev) =>
      prev.map((s) => (s.id === season.id ? { ...s, family_tree_pairs: s.family_tree_pairs.map((p) => (p.id === pairId ? { ...p, ...patch } : p)) } : s))
    );
  }

  async function handleAddPair() {
    if (!sire || !dam) {
      setError("Select both a sire and a dam.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await createBreedingPair(supabase, { seasonId: season.id, ownerId, sireId: sire.id, damId: dam.id, pairedAt: pairedAt || null, notes: null });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const newPair: Pair = { id: result.pairId, sire_id: sire.id, dam_id: dam.id, paired_at: pairedAt || null, egg_count: 0, hatched_count: 0, status: "active", notes: null, sire, dam };
    setSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, family_tree_pairs: [newPair, ...s.family_tree_pairs] } : s)));
    setShowAddPair(false);
    setSire(null);
    setDam(null);
    setPairedAt("");
  }

  async function handleUpdateStats(pair: Pair, eggCount: number, hatchedCount: number) {
    await updatePairStats(supabase, pair.id, { eggCount, hatchedCount });
    updatePairInState(pair.id, { egg_count: eggCount, hatched_count: hatchedCount });
  }

  async function handleDeletePair(pairId: string) {
    await deleteBreedingPair(supabase, pairId);
    setSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, family_tree_pairs: s.family_tree_pairs.filter((p) => p.id !== pairId) } : s)));
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, color: "#E8EDF3" }}>{season.label}</div>
          {(season.start_date || season.end_date) && <div style={{ fontSize: 11, color: "#5B6675" }}>{season.start_date} — {season.end_date || "ongoing"}</div>}
        </div>
        <button style={btnGhost} onClick={() => setShowAddPair((s) => !s)}>{showAddPair ? "Cancel" : "+ Add Pair"}</button>
      </div>

      {showAddPair && (
        <div style={{ background: "#0A0D12", border: "1px solid #2DD4BF", borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <FamilyTreeSireDamPicker sire={sire} dam={dam} onChangeSire={setSire} onChangeDam={setDam} />
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Paired On</label>
            <input type="date" value={pairedAt} onChange={(e) => setPairedAt(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
          </div>
          {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 10 }}>{error}</p>}
          <button style={{ ...btnPrimary, marginTop: 12 }} onClick={handleAddPair} disabled={saving}>{saving ? "Saving…" : "Save Pair"}</button>
        </div>
      )}

      {season.family_tree_pairs.length === 0 ? (
        <p style={{ fontSize: 12, color: "#5B6675" }}>No pairs recorded for this season yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {season.family_tree_pairs.map((pair) => (
            <PairRow key={pair.id} pair={pair} onUpdateStats={handleUpdateStats} onDelete={() => handleDeletePair(pair.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PairRow({ pair, onUpdateStats, onDelete }: { pair: Pair; onUpdateStats: (pair: Pair, eggs: number, hatched: number) => void; onDelete: () => void }) {
  const [eggs, setEggs] = useState(pair.egg_count);
  const [hatched, setHatched] = useState(pair.hatched_count);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: "#0A0D12", borderRadius: 4, border: "1px solid #1C232E" }}>
      <div style={{ flex: 1, fontSize: 13, color: "#E8EDF3" }}>
        {miniLabel(pair.sire)} <span style={{ color: "#5B6675" }}>×</span> {miniLabel(pair.dam)}
        {pair.paired_at && <span style={{ fontSize: 11, color: "#5B6675" }}> · paired {pair.paired_at}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 10, color: "#5B6675" }}>Eggs</label>
        <input type="number" value={eggs} onChange={(e) => setEggs(Number(e.target.value))} style={{ width: 50, ...inputStyle, padding: "5px 8px" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 10, color: "#5B6675" }}>Hatched</label>
        <input type="number" value={hatched} onChange={(e) => setHatched(Number(e.target.value))} style={{ width: 50, ...inputStyle, padding: "5px 8px" }} />
      </div>
      <button style={{ ...btnGhost, fontSize: 11, padding: "6px 12px" }} onClick={() => onUpdateStats(pair, eggs, hatched)}>Save</button>
      <button onClick={onDelete} style={{ background: "none", border: "none", color: "#5B6675", cursor: "pointer", fontSize: 14 }}>✕</button>
    </div>
  );
}
