"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addFlyLogEntry, deleteFlyLogEntry } from "@/lib/family-tree/fly-log";

type Bird = { id: string; name: string | null; ring_number: string | null };
type FlyLogEntry = { id: string; bird_id: string; logged_at: string; depth: string | null; frequency: string | null; kit_behavior: string | null; notes: string | null };

const inputStyle: React.CSSProperties = { width: "100%", background: "#0A0D12", border: "1px solid #1C232E", color: "#E8EDF3", padding: "10px 12px", fontSize: 13, borderRadius: 4, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5B6675", display: "block", marginBottom: 6 };
const card: React.CSSProperties = { background: "#0D1117", border: "1px solid #1C232E", borderRadius: 6, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#2DD4BF", color: "#0A0D12", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, borderRadius: 4, cursor: "pointer" };

export default function PerformanceClient({ ownerId, birds, initialFlyLog }: { ownerId: string; birds: Bird[]; initialFlyLog: FlyLogEntry[] }) {
  const supabase = createClient();
  const [flyLog, setFlyLog] = useState(initialFlyLog);
  const [birdId, setBirdId] = useState(birds[0]?.id ?? "");
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 10));
  const [depth, setDepth] = useState("");
  const [frequency, setFrequency] = useState("");
  const [kitBehavior, setKitBehavior] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const birdNameMap = new Map(birds.map((b) => [b.id, b.name || b.ring_number || "Unnamed bird"]));

  async function handleAdd() {
    if (!birdId) {
      setError("Register a bird in the Registry first.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await addFlyLogEntry(supabase, { birdId, ownerId, loggedAt, depth: depth || null, frequency: frequency || null, kitBehavior: kitBehavior || null, notes: notes || null });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setFlyLog((prev) => [{ id: result.entryId, bird_id: birdId, logged_at: loggedAt, depth: depth || null, frequency: frequency || null, kit_behavior: kitBehavior || null, notes: notes || null }, ...prev]);
    setDepth("");
    setFrequency("");
    setKitBehavior("");
    setNotes("");
  }

  async function handleDelete(entryId: string) {
    await deleteFlyLogEntry(supabase, entryId);
    setFlyLog((prev) => prev.filter((e) => e.id !== entryId));
  }

  return (
    <div>
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#E8EDF3", marginBottom: 14 }}>Log a fly note</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Bird</label>
            <select value={birdId} onChange={(e) => setBirdId(e.target.value)} style={inputStyle}>
              {birds.length === 0 && <option value="">No birds registered yet</option>}
              {birds.map((b) => (
                <option key={b.id} value={b.id}>{b.name || b.ring_number || "Unnamed"}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Depth</label>
            <input value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g. 12-15 ft" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Frequency</label>
            <input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. tight, frequent" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Kit Behavior</label>
          <input value={kitBehavior} onChange={(e) => setKitBehavior(e.target.value)} placeholder="e.g. held together well, one bird broke off" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 10 }}>{error}</p>}
        <button style={btnPrimary} onClick={handleAdd} disabled={saving || !birdId}>{saving ? "Saving…" : "Save Entry"}</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {flyLog.length === 0 && <p style={{ fontSize: 13, color: "#5B6675" }}>No fly log entries yet.</p>}
        {flyLog.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "#0D1117", border: "1px solid #1C232E", borderRadius: 4 }}>
            <div>
              <div style={{ fontSize: 13, color: "#E8EDF3" }}>{birdNameMap.get(e.bird_id) || "Unknown bird"} <span style={{ fontSize: 11, color: "#5B6675" }}>· {e.logged_at}</span></div>
              <div style={{ fontSize: 12, color: "#5B6675", marginTop: 4 }}>{[e.depth, e.frequency, e.kit_behavior].filter(Boolean).join(" · ") || "—"}</div>
              {e.notes && <div style={{ fontSize: 12, color: "#5B6675", marginTop: 4 }}>{e.notes}</div>}
            </div>
            <button onClick={() => handleDelete(e.id)} style={{ background: "none", border: "none", color: "#5B6675", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
