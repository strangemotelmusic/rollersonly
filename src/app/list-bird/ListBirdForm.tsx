"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputStyle = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none", fontFamily: "var(--ff-body)" };
const labelStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: 8 };

const DURATIONS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
];

export default function ListBirdForm({ userId, loftId }: { userId: string; loftId: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [ringNumber, setRingNumber] = useState("");
  const [sex, setSex] = useState("cock");
  const [color, setColor] = useState("");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState(100);
  const [reservePrice, setReservePrice] = useState(0);
  const [bidIncrement, setBidIncrement] = useState(25);
  const [durationHours, setDurationHours] = useState(72);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Bird name is required."); return; }
    if (!startingBid || startingBid <= 0) { setError("Starting bid must be greater than $0."); return; }

    setLoading(true);

    let primaryPhotoUrl: string | null = null;
    if (photo) {
      const path = `${userId}/${crypto.randomUUID()}-${photo.name}`;
      const { error: uploadErr } = await supabase.storage.from("bird-photos").upload(path, photo);
      if (uploadErr) { setLoading(false); setError(`Photo upload failed: ${uploadErr.message}`); return; }
      primaryPhotoUrl = supabase.storage.from("bird-photos").getPublicUrl(path).data.publicUrl;
    }

    const platformId = `RO-${Date.now().toString(36).toUpperCase()}`;

    const { data: bird, error: birdErr } = await supabase
      .from("birds")
      .insert({
        platform_id: platformId,
        owner_id: userId,
        loft_id: loftId,
        name,
        ring_number: ringNumber || null,
        sex,
        color: color || null,
        birth_year: birthYear,
        primary_photo_url: primaryPhotoUrl,
        notes: description || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (birdErr || !bird) { setLoading(false); setError(birdErr?.message || "Could not create bird."); return; }

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);

    const { data: auction, error: auctionErr } = await supabase
      .from("auctions")
      .insert({
        bird_id: bird.id,
        seller_id: userId,
        loft_id: loftId,
        title: name,
        description: description || null,
        reserve_price: reservePrice,
        starting_bid: startingBid,
        bid_increment: bidIncrement,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "live",
      })
      .select("id")
      .single();

    if (auctionErr || !auction) { setLoading(false); setError(auctionErr?.message || "Could not create auction."); return; }

    router.push(`/auctions/${auction.id}`);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={labelStyle}>Bird name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Blue Bar Champion Cock" style={inputStyle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Ring number</label>
          <input value={ringNumber} onChange={(e) => setRingNumber(e.target.value)} placeholder="AU26-TX-00001" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
            <option value="cock">Cock</option>
            <option value="hen">Hen</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Blue Bar" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Birth year</label>
          <input type="number" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Photo</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} style={{ color: "var(--muted)", fontSize: 13 }} />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bloodline, roll quality, kit performance…" style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Starting bid ($)</label>
          <input type="number" value={startingBid} onChange={(e) => setStartingBid(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Reserve price ($)</label>
          <input type="number" value={reservePrice} onChange={(e) => setReservePrice(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bid increment ($)</label>
          <input type="number" value={bidIncrement} onChange={(e) => setBidIncrement(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Auction duration</label>
        <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} style={inputStyle}>
          {DURATIONS.map((d) => (
            <option key={d.hours} value={d.hours}>{d.label}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ color: "#E74C3C", fontSize: 13, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: 2, border: "0.5px solid rgba(231,76,60,0.3)" }}>{error}</div>}

      <button className="btn-gold-lg" onClick={handleSubmit} disabled={loading} style={{ width: "100%", textAlign: "center" }}>
        {loading ? "Publishing…" : "Publish Listing"}
      </button>
    </div>
  );
}
