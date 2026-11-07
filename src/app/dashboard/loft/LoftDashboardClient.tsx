"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { registerBird, listBirdForSale } from "@/lib/birds/register";
import PreviewIcon from "@/components/PreviewIcon";
import styles from "@/styles/PreviewTheme.module.css";

export type Bird = {
  id: string;
  name: string | null;
  ring_number: string | null;
  sex: string | null;
  color: string | null;
  birth_year: number | null;
  primary_photo_url: string | null;
  is_active: boolean | null;
  available_for_matchmaking: boolean | null;
  auctions: { id: string; status: string }[];
};

const inputStyle: React.CSSProperties = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "10px 12px", fontSize: 13, borderRadius: "var(--radius-sm)", outline: "none" };

export default function LoftDashboardClient({
  ownerId,
  loftId,
  initialBirds,
  canOfferMatchmaking,
}: {
  ownerId: string;
  loftId: string | null;
  initialBirds: Bird[];
  canOfferMatchmaking: boolean;
}) {
  const supabase = createClient();
  const [birds, setBirds] = useState(initialBirds);
  const [showRegister, setShowRegister] = useState(false);
  const [listingBirdId, setListingBirdId] = useState<string | null>(null);

  async function toggleMatchmaking(birdId: string, next: boolean) {
    setBirds((prev) => prev.map((b) => (b.id === birdId ? { ...b, available_for_matchmaking: next } : b)));
    const { error } = await supabase.from("birds").update({ available_for_matchmaking: next }).eq("id", birdId);
    if (error) {
      setBirds((prev) => prev.map((b) => (b.id === birdId ? { ...b, available_for_matchmaking: !next } : b)));
    }
  }

  return (
    <div className={styles.panel} style={{ marginTop: 24 }}>
      <div className={styles["panel-heading"]}>
        <h2>Your bird records</h2>
        <button className={`${styles.btn} ${styles["btn-small"]}`} onClick={() => setShowRegister((s) => !s)}>
          <PreviewIcon name="arrowUp" className={styles.icon} /> {showRegister ? "Cancel" : "Add bird"}
        </button>
      </div>

      {showRegister && (
        <div style={{ border: "0.5px solid var(--border-gold)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 24, background: "var(--void)" }}>
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

      {birds.length === 0 && !showRegister ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Give your birds a home. Start with a band number and the records you know.</p>
      ) : (
        <div className={styles["table-scroll"]}>
          <table className={styles["data-table"]}>
            <thead>
              <tr>
                <th>Bird / band</th>
                <th>Sex</th>
                <th>Color</th>
                <th>Status</th>
                {canOfferMatchmaking && <th>Matchmaking</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {birds.map((b) => {
                const isListed = Boolean(b.auctions?.some((a) => a.status === "live"));
                return (
                  <tr key={b.id}>
                    <td>
                      <div className={styles["bird-cell"]}>
                        {b.primary_photo_url ? (
                          <Image src={b.primary_photo_url} alt={b.name || ""} width={40} height={43} />
                        ) : (
                          <div style={{ width: 40, height: 43, borderRadius: 6, background: "var(--void)", flexShrink: 0 }} />
                        )}
                        <span>
                          <strong>{b.name || "Unnamed bird"}</strong>
                          <small>{b.ring_number || "—"}</small>
                        </span>
                      </div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{b.sex || "—"}</td>
                    <td>{b.color || "—"}</td>
                    <td>
                      <span className={styles.pill} style={isListed ? { color: "#ff8080", borderColor: "rgba(255,80,80,.4)" } : undefined}>
                        {isListed ? "● Listed" : "Not listed"}
                      </span>
                    </td>
                    {canOfferMatchmaking && (
                      <td>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <input type="checkbox" checked={Boolean(b.available_for_matchmaking)} onChange={(e) => toggleMatchmaking(b.id, e.target.checked)} />
                        </label>
                      </td>
                    )}
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link href={`/birds/${b.id}`} className={`${styles.btn} ${styles["btn-small"]}`}>
                          View
                        </Link>
                        <Link href={`/list-bird/${b.id}`} className={`${styles.btn} ${styles["btn-small"]}`}>
                          Edit
                        </Link>
                        {!isListed && (
                          <button
                            className={`${styles.btn} ${styles["btn-primary"]} ${styles["btn-small"]}`}
                            onClick={() => setListingBirdId(listingBirdId === b.id ? null : b.id)}
                          >
                            List for sale
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
      available_for_matchmaking: false,
      auctions: [],
    });
  }

  return (
    <div className={styles["form-grid"]}>
      <label className={styles.field}>
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </label>
      <label className={styles.field}>
        <span>Ring Number</span>
        <input value={ringNumber} onChange={(e) => setRingNumber(e.target.value)} style={inputStyle} />
      </label>
      <label className={styles.field}>
        <span>Sex</span>
        <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
          <option value="cock">Cock</option>
          <option value="hen">Hen</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>Color</span>
        <input value={color} onChange={(e) => setColor(e.target.value)} style={inputStyle} />
      </label>
      <label className={styles.field}>
        <span>Birth Year</span>
        <input type="number" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} style={inputStyle} />
      </label>
      <label className={`${styles.field} ${styles.full}`}>
        <span>Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
      <label className={`${styles.field} ${styles.full}`}>
        <span>Photos</span>
        <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} style={{ fontSize: 12, color: "var(--muted)" }} />
      </label>

      {error && (
        <p className={styles.full} style={{ fontSize: 12, color: "#e8a3a3" }}>
          {error}
        </p>
      )}

      <div className={styles.full}>
        <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={handleSubmit} disabled={saving}>
          {saving ? "Registering…" : "Register Bird"}
        </button>
      </div>
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
    <div style={{ border: "0.5px solid var(--border-gold)", borderRadius: "var(--radius-lg)", padding: 20, marginTop: 20, background: "var(--void)" }}>
      <div style={{ fontSize: 13, color: "var(--white)", marginBottom: 14 }}>List &quot;{birdName}&quot; for sale</div>
      <div className={styles["form-grid"]} style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <label className={styles.field}>
          <span>Starting Bid ($)</span>
          <input type="number" value={startingBid} onChange={(e) => setStartingBid(Number(e.target.value))} style={inputStyle} />
        </label>
        <label className={styles.field}>
          <span>Reserve ($)</span>
          <input type="number" value={reservePrice} onChange={(e) => setReservePrice(Number(e.target.value))} style={inputStyle} />
        </label>
        <label className={styles.field}>
          <span>Bid Increment ($)</span>
          <input type="number" value={bidIncrement} onChange={(e) => setBidIncrement(Number(e.target.value))} style={inputStyle} />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          <span>Duration</span>
          <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} style={inputStyle}>
            <option value={24}>1 day</option>
            <option value={72}>3 days</option>
            <option value={168}>7 days</option>
          </select>
        </label>
      </div>
      {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 10 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={handleSubmit} disabled={saving}>
          {saving ? "Publishing…" : "Publish Listing"}
        </button>
        <button className={styles.btn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
