"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import SireDamPicker, { type BirdOption } from "@/components/pedigree/SireDamPicker";
import { registerBird, listBirdForSale } from "@/lib/birds/register";
import { createSeason, createBreedingPair, updatePairStats, deleteBreedingPair } from "@/lib/breeding/actions";
import { addFlyLogEntry, deleteFlyLogEntry } from "@/lib/fly-log/actions";

type MiniBird = { id: string; name: string | null; ring_number: string | null } | null;

export type Bird = {
  id: string;
  name: string | null;
  ring_number: string | null;
  sex: string | null;
  color: string | null;
  birth_year: number | null;
  primary_photo_url: string | null;
  is_active: boolean | null;
  sire: MiniBird;
  dam: MiniBird;
  auctions: { id: string; status: string }[];
};

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

export type Season = { id: string; label: string; start_date: string | null; end_date: string | null; notes: string | null; breeding_pairs: Pair[] };
export type FlyLogEntry = { id: string; bird_id: string; logged_at: string; depth: string | null; frequency: string | null; kit_behavior: string | null; notes: string | null };

const inputStyle: React.CSSProperties = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "10px 12px", fontSize: 13, borderRadius: 2, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 };
const sectionCard: React.CSSProperties = { background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20 };

function miniLabel(b: MiniBird): string {
  if (!b) return "Unrecorded";
  return b.name || b.ring_number || "Unnamed";
}

export default function LoftDashboardClient({
  ownerId,
  loftId,
  initialBirds,
  initialSeasons,
  initialFlyLog,
}: {
  ownerId: string;
  loftId: string | null;
  initialBirds: Bird[];
  initialSeasons: Season[];
  initialFlyLog: FlyLogEntry[];
}) {
  const [tab, setTab] = useState<"birds" | "breeding" | "flylog">("birds");
  const [birds, setBirds] = useState(initialBirds);
  const [seasons, setSeasons] = useState(initialSeasons);
  const [flyLog, setFlyLog] = useState(initialFlyLog);

  const birdOptions: BirdOption[] = birds.map((b) => ({ id: b.id, name: b.name, ring_number: b.ring_number, sex: b.sex }));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: "0.5px solid var(--border)" }}>
        {[
          { key: "birds", label: "My Birds" },
          { key: "breeding", label: "Breeding Seasons" },
          { key: "flylog", label: "Fly Log" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.key ? "var(--gold)" : "transparent"}`,
              color: tab === t.key ? "var(--gold)" : "var(--muted)",
              fontSize: 13,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "birds" && (
        <BirdsTab ownerId={ownerId} loftId={loftId} birds={birds} setBirds={setBirds} />
      )}
      {tab === "breeding" && (
        <BreedingTab ownerId={ownerId} loftId={loftId} seasons={seasons} setSeasons={setSeasons} birdOptions={birdOptions} />
      )}
      {tab === "flylog" && (
        <FlyLogTab ownerId={ownerId} birds={birds} flyLog={flyLog} setFlyLog={setFlyLog} />
      )}
    </div>
  );
}

function BirdsTab({
  ownerId,
  loftId,
  birds,
  setBirds,
}: {
  ownerId: string;
  loftId: string | null;
  birds: Bird[];
  setBirds: (fn: (prev: Bird[]) => Bird[]) => void;
}) {
  const [showRegister, setShowRegister] = useState(false);
  const [listingBirdId, setListingBirdId] = useState<string | null>(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{birds.length} bird{birds.length === 1 ? "" : "s"} registered</div>
        <button className="btn-gold" style={{ padding: "9px 18px", fontSize: 12 }} onClick={() => setShowRegister((s) => !s)}>
          {showRegister ? "Cancel" : "+ Register a Bird"}
        </button>
      </div>

      {showRegister && (
        <div style={{ ...sectionCard, marginBottom: 24, border: "0.5px solid var(--border-gold)" }}>
          <RegisterBirdForm
            ownerId={ownerId}
            loftId={loftId}
            onRegistered={(bird) => {
              setBirds((prev) => [bird, ...prev]);
              setShowRegister(false);
            }}
            existingBirdIds={birds.map((b) => b.id)}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {birds.length === 0 && !showRegister && <p style={{ fontSize: 13, color: "var(--muted)" }}>No birds registered yet.</p>}
        {birds.map((b) => {
          const isListed = Boolean(b.auctions?.some((a) => a.status === "live"));
          return (
            <div key={b.id} style={{ ...sectionCard, display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", width: 64, height: 64, borderRadius: 2, overflow: "hidden", flexShrink: 0, background: "var(--void)" }}>
                {b.primary_photo_url && <Image src={b.primary_photo_url} alt={b.name || ""} fill style={{ objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--white)" }}>{b.name || "Unnamed bird"} {b.ring_number && <span style={{ fontSize: 11, color: "var(--gold)" }}>{b.ring_number}</span>}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Sire: {miniLabel(b.sire)} · Dam: {miniLabel(b.dam)}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 2,
                  background: isListed ? "rgba(255,50,50,0.12)" : "rgba(255,255,255,0.06)",
                  color: isListed ? "#ff6666" : "var(--muted)",
                  flexShrink: 0,
                }}
              >
                {isListed ? "● Listed" : "Not Listed"}
              </span>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link href={`/birds/${b.id}`} className="btn-ghost" style={{ fontSize: 11, padding: "8px 14px" }}>Pedigree</Link>
                {isListed ? (
                  <Link href={`/list-bird/${b.id}`} className="btn-ghost" style={{ fontSize: 11, padding: "8px 14px" }}>Manage Listing</Link>
                ) : (
                  <button className="btn-gold" style={{ fontSize: 11, padding: "8px 14px" }} onClick={() => setListingBirdId(listingBirdId === b.id ? null : b.id)}>
                    List for Sale
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {listingBirdId && (
        <ListForSaleForm
          birdId={listingBirdId}
          ownerId={ownerId}
          loftId={loftId}
          birdName={birds.find((b) => b.id === listingBirdId)?.name || "Bird"}
          onClose={() => setListingBirdId(null)}
          onListed={() => {
            setBirds((prev) => prev.map((b) => (b.id === listingBirdId ? { ...b, is_active: true, auctions: [...b.auctions, { id: "new", status: "live" }] } : b)));
            setListingBirdId(null);
          }}
        />
      )}
    </div>
  );
}

function RegisterBirdForm({
  ownerId,
  loftId,
  onRegistered,
  existingBirdIds,
}: {
  ownerId: string;
  loftId: string | null;
  onRegistered: (bird: Bird) => void;
  existingBirdIds: string[];
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [ringNumber, setRingNumber] = useState("");
  const [sex, setSex] = useState("cock");
  const [color, setColor] = useState("");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());
  const [sire, setSire] = useState<BirdOption | null>(null);
  const [dam, setDam] = useState<BirdOption | null>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Bird name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await registerBird(supabase, {
      ownerId,
      loftId,
      name,
      ringNumber: ringNumber || null,
      sex,
      color: color || null,
      birthYear,
      sireId: sire?.id ?? null,
      damId: dam?.id ?? null,
      notes: notes || null,
      photos,
    });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onRegistered({
      id: result.birdId,
      name,
      ring_number: ringNumber || null,
      sex,
      color: color || null,
      birth_year: birthYear,
      primary_photo_url: null,
      is_active: false,
      sire,
      dam,
      auctions: [],
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ring Number</label>
          <input value={ringNumber} onChange={(e) => setRingNumber(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
            <option value="cock">Cock</option>
            <option value="hen">Hen</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Birth Year</label>
          <input type="number" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <SireDamPicker sire={sire} dam={dam} onChangeSire={setSire} onChangeDam={setDam} excludeBirdId={undefined} />

      <div>
        <label style={labelStyle}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div>
        <label style={labelStyle}>Photos</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} style={{ fontSize: 12, color: "var(--muted)" }} />
      </div>

      {error && <p style={{ fontSize: 12, color: "#e8a3a3" }}>{error}</p>}

      <button className="btn-gold" style={{ padding: "10px 22px" }} onClick={handleSubmit} disabled={saving}>
        {saving ? "Registering…" : "Register Bird"}
      </button>
    </div>
  );
}

function ListForSaleForm({
  birdId,
  ownerId,
  loftId,
  birdName,
  onClose,
  onListed,
}: {
  birdId: string;
  ownerId: string;
  loftId: string | null;
  birdName: string;
  onClose: () => void;
  onListed: () => void;
}) {
  const supabase = createClient();
  const [startingBid, setStartingBid] = useState(100);
  const [reservePrice, setReservePrice] = useState(0);
  const [bidIncrement, setBidIncrement] = useState(25);
  const [durationHours, setDurationHours] = useState(72);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setError("");
    const result = await listBirdForSale(supabase, birdId, {
      sellerId: ownerId,
      loftId,
      title: birdName,
      description: null,
      startingBid,
      reservePrice,
      bidIncrement,
      durationHours,
    });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onListed();
  }

  return (
    <div style={{ ...sectionCard, marginTop: 16, border: "0.5px solid var(--border-gold)" }}>
      <div style={{ fontSize: 13, color: "var(--white)", marginBottom: 14 }}>List &quot;{birdName}&quot; for sale</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Starting Bid ($)</label>
          <input type="number" value={startingBid} onChange={(e) => setStartingBid(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Reserve ($)</label>
          <input type="number" value={reservePrice} onChange={(e) => setReservePrice(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bid Increment ($)</label>
          <input type="number" value={bidIncrement} onChange={(e) => setBidIncrement(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Duration</label>
        <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} style={inputStyle}>
          <option value={24}>1 day</option>
          <option value={72}>3 days</option>
          <option value={168}>7 days</option>
        </select>
      </div>
      {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 10 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-gold" style={{ padding: "9px 20px" }} onClick={handleSubmit} disabled={saving}>
          {saving ? "Publishing…" : "Publish Listing"}
        </button>
        <button className="btn-ghost" style={{ padding: "9px 20px" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function BreedingTab({
  ownerId,
  loftId,
  seasons,
  setSeasons,
  birdOptions,
}: {
  ownerId: string;
  loftId: string | null;
  seasons: Season[];
  setSeasons: (fn: (prev: Season[]) => Season[]) => void;
  birdOptions: BirdOption[];
}) {
  const supabase = createClient();
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
    const result = await createSeason(supabase, { ownerId, loftId, label, startDate: startDate || null, endDate: endDate || null, notes: null });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSeasons((prev) => [{ id: result.seasonId, label, start_date: startDate || null, end_date: endDate || null, notes: null, breeding_pairs: [] }, ...prev]);
    setShowNewSeason(false);
    setLabel("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{seasons.length} season{seasons.length === 1 ? "" : "s"}</div>
        <button className="btn-gold" style={{ padding: "9px 18px", fontSize: 12 }} onClick={() => setShowNewSeason((s) => !s)}>
          {showNewSeason ? "Cancel" : "+ New Season"}
        </button>
      </div>

      {showNewSeason && (
        <div style={{ ...sectionCard, marginBottom: 24, border: "0.5px solid var(--border-gold)" }}>
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
          <button className="btn-gold" style={{ padding: "9px 20px" }} onClick={handleCreateSeason} disabled={saving}>
            {saving ? "Creating…" : "Create Season"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {seasons.length === 0 && !showNewSeason && <p style={{ fontSize: 13, color: "var(--muted)" }}>No breeding seasons yet.</p>}
        {seasons.map((season) => (
          <SeasonCard key={season.id} ownerId={ownerId} season={season} birdOptions={birdOptions} setSeasons={setSeasons} />
        ))}
      </div>
    </div>
  );
}

function SeasonCard({
  ownerId,
  season,
  birdOptions,
  setSeasons,
}: {
  ownerId: string;
  season: Season;
  birdOptions: BirdOption[];
  setSeasons: (fn: (prev: Season[]) => Season[]) => void;
}) {
  const supabase = createClient();
  const [showAddPair, setShowAddPair] = useState(false);
  const [sire, setSire] = useState<BirdOption | null>(null);
  const [dam, setDam] = useState<BirdOption | null>(null);
  const [pairedAt, setPairedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updatePairInState(pairId: string, patch: Partial<Pair>) {
    setSeasons((prev) =>
      prev.map((s) => (s.id === season.id ? { ...s, breeding_pairs: s.breeding_pairs.map((p) => (p.id === pairId ? { ...p, ...patch } : p)) } : s))
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
    setSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, breeding_pairs: [newPair, ...s.breeding_pairs] } : s)));
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
    setSeasons((prev) => prev.map((s) => (s.id === season.id ? { ...s, breeding_pairs: s.breeding_pairs.filter((p) => p.id !== pairId) } : s)));
  }

  return (
    <div style={sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, color: "var(--white)" }}>{season.label}</div>
          {(season.start_date || season.end_date) && (
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{season.start_date} — {season.end_date || "ongoing"}</div>
          )}
        </div>
        <button className="btn-ghost" style={{ fontSize: 11, padding: "7px 14px" }} onClick={() => setShowAddPair((s) => !s)}>
          {showAddPair ? "Cancel" : "+ Add Pair"}
        </button>
      </div>

      {showAddPair && (
        <div style={{ background: "var(--deep)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 16, marginBottom: 16 }}>
          <SireDamPicker sire={sire} dam={dam} onChangeSire={setSire} onChangeDam={setDam} />
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Paired On</label>
            <input type="date" value={pairedAt} onChange={(e) => setPairedAt(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
          </div>
          {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 10 }}>{error}</p>}
          <button className="btn-gold" style={{ padding: "8px 18px", marginTop: 12 }} onClick={handleAddPair} disabled={saving}>
            {saving ? "Saving…" : "Save Pair"}
          </button>
        </div>
      )}

      {season.breeding_pairs.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>No pairs recorded for this season yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {season.breeding_pairs.map((pair) => (
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
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: "var(--deep)", borderRadius: 2, border: "0.5px solid var(--border)" }}>
      <div style={{ flex: 1, fontSize: 13, color: "var(--white)" }}>
        {miniLabel(pair.sire)} <span style={{ color: "var(--muted)" }}>×</span> {miniLabel(pair.dam)}
        {pair.paired_at && <span style={{ fontSize: 11, color: "var(--muted)" }}> · paired {pair.paired_at}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 10, color: "var(--muted)" }}>Eggs</label>
        <input type="number" value={eggs} onChange={(e) => setEggs(Number(e.target.value))} style={{ width: 50, ...inputStyle, padding: "5px 8px" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 10, color: "var(--muted)" }}>Hatched</label>
        <input type="number" value={hatched} onChange={(e) => setHatched(Number(e.target.value))} style={{ width: 50, ...inputStyle, padding: "5px 8px" }} />
      </div>
      <button className="btn-ghost" style={{ fontSize: 10, padding: "6px 12px" }} onClick={() => onUpdateStats(pair, eggs, hatched)}>Save</button>
      <button onClick={onDelete} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}>✕</button>
    </div>
  );
}

function FlyLogTab({
  ownerId,
  birds,
  flyLog,
  setFlyLog,
}: {
  ownerId: string;
  birds: Bird[];
  flyLog: FlyLogEntry[];
  setFlyLog: (fn: (prev: FlyLogEntry[]) => FlyLogEntry[]) => void;
}) {
  const supabase = createClient();
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
      setError("Register a bird first.");
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
      <div style={{ ...sectionCard, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "var(--white)", marginBottom: 14 }}>Log a fly note</div>
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
        <button className="btn-gold" style={{ padding: "9px 20px" }} onClick={handleAdd} disabled={saving || !birdId}>
          {saving ? "Saving…" : "Save Entry"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {flyLog.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>No fly log entries yet.</p>}
        {flyLog.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--white)" }}>{birdNameMap.get(e.bird_id) || "Unknown bird"} <span style={{ fontSize: 11, color: "var(--muted)" }}>· {e.logged_at}</span></div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {[e.depth, e.frequency, e.kit_behavior].filter(Boolean).join(" · ") || "—"}
              </div>
              {e.notes && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{e.notes}</div>}
            </div>
            <button onClick={() => handleDelete(e.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
