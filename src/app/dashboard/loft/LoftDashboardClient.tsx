"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { registerBird, listBirdForSale } from "@/lib/birds/register";

export type Bird = {
  id: string;
  name: string | null;
  ring_number: string | null;
  sex: string | null;
  color: string | null;
  birth_year: number | null;
  primary_photo_url: string | null;
  is_active: boolean | null;
  auctions: { id: string; status: string }[];
};

const inputStyle: React.CSSProperties = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "10px 12px", fontSize: 13, borderRadius: 2, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 };
const sectionCard: React.CSSProperties = { background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20 };

export default function LoftDashboardClient({
  ownerId,
  loftId,
  initialBirds,
}: {
  ownerId: string;
  loftId: string | null;
  initialBirds: Bird[];
}) {
  const [birds, setBirds] = useState(initialBirds);
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
                  {[b.color, b.sex].filter(Boolean).join(" · ") || "—"}
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
                <Link href={`/birds/${b.id}`} className="btn-ghost" style={{ fontSize: 11, padding: "8px 14px" }}>View</Link>
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
}: {
  ownerId: string;
  loftId: string | null;
  onRegistered: (bird: Bird) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [ringNumber, setRingNumber] = useState("");
  const [sex, setSex] = useState("cock");
  const [color, setColor] = useState("");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());
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
