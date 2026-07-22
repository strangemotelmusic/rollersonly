"use client";
import { useEffect, useRef, useState } from "react";
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
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewFailed, setPreviewFailed] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    setPreviewFailed({});
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Bird name is required."); return; }
    if (!startingBid || startingBid <= 0) { setError("Starting bid must be greater than $0."); return; }
    if (photos.length === 0) { setError("Add at least one photo — buyers won't bid on a bird they can't see."); return; }

    setLoading(true);

    const uploadedUrls: string[] = [];
    for (const file of photos) {
      const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("bird-photos").upload(path, file);
      if (uploadErr) { setLoading(false); setError(`Photo upload failed: ${uploadErr.message}`); return; }
      uploadedUrls.push(supabase.storage.from("bird-photos").getPublicUrl(path).data.publicUrl);
    }
    const primaryPhotoUrl = uploadedUrls[0] ?? null;

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

    if (uploadedUrls.length > 0) {
      await supabase.from("bird_photos").insert(
        uploadedUrls.map((url, i) => ({
          bird_id: bird.id,
          url,
          is_primary: i === 0,
          sort_order: i,
        }))
      );
    }

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
        <label style={labelStyle}>Photos</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
          style={{ display: "none" }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {previewUrls.map((url, i) => (
            <div key={i} style={{ position: "relative", width: 88, height: 88, borderRadius: 2, overflow: "hidden", border: `1px solid ${i === 0 ? "var(--gold)" : "var(--border)"}` }}>
              {previewFailed[i] ? (
                <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 4, fontSize: 9, color: "var(--muted)", background: "var(--deep)" }}>
                  {photos[i]?.name || `Photo ${i + 1}`}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => setPreviewFailed((prev) => ({ ...prev, [i]: true }))}
                />
              )}
              {i === 0 && (
                <span style={{ position: "absolute", top: 2, left: 2, background: "var(--gold)", color: "var(--black)", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 1 }}>COVER</span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.75)", color: "var(--white)", border: "none", fontSize: 12, lineHeight: 1, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 88,
              height: 88,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "var(--deep)",
              border: "1px dashed var(--border-gold)",
              borderRadius: 2,
              color: "var(--gold)",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Add Photos
          </button>
        </div>

        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
          {photos.length === 0 ? "At least one photo is required. First photo becomes the cover image." : `${photos.length} photo${photos.length === 1 ? "" : "s"} selected · first one is the cover image.`}
        </div>
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
