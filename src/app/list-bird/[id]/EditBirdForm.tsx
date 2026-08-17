"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const inputStyle = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none", fontFamily: "var(--ff-body)" };
const labelStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: 8 };

type ExistingPhoto = { id: string; url: string; sort_order: number | null };

export default function EditBirdForm({
  birdId,
  auctionId,
  auctionStatus,
  initial,
  existingPhotos,
}: {
  birdId: string;
  auctionId: string | null;
  auctionStatus: string | null;
  initial: {
    name: string;
    ringNumber: string;
    sex: string;
    color: string;
    birthYear: number;
    description: string;
  };
  existingPhotos: ExistingPhoto[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initial.name);
  const [ringNumber, setRingNumber] = useState(initial.ringNumber);
  const [sex, setSex] = useState(initial.sex);
  const [color, setColor] = useState(initial.color);
  const [birthYear, setBirthYear] = useState(initial.birthYear);
  const [description, setDescription] = useState(initial.description);
  const [photos, setPhotos] = useState(existingPhotos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCancelled = auctionStatus === "cancelled" || auctionStatus === "ended";

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Bird name is required."); return; }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setError("You must be signed in."); return; }

    const newUrls: string[] = [];
    for (const file of newFiles) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("bird-photos").upload(path, file);
      if (uploadErr) { setSaving(false); setError(`Photo upload failed: ${uploadErr.message}`); return; }
      newUrls.push(supabase.storage.from("bird-photos").getPublicUrl(path).data.publicUrl);
    }

    if (newUrls.length > 0) {
      const startIndex = photos.length;
      const { error: photosErr } = await supabase.from("bird_photos").insert(
        newUrls.map((url, i) => ({ bird_id: birdId, url, is_primary: photos.length === 0 && i === 0, sort_order: startIndex + i }))
      );
      if (photosErr) { setSaving(false); setError(photosErr.message); return; }
    }

    const { error: birdErr } = await supabase
      .from("birds")
      .update({
        name,
        ring_number: ringNumber || null,
        sex,
        color: color || null,
        birth_year: birthYear,
        notes: description || null,
        ...(newUrls.length > 0 && photos.length === 0 ? { primary_photo_url: newUrls[0] } : {}),
      })
      .eq("id", birdId);
    if (birdErr) { setSaving(false); setError(birdErr.message); return; }

    if (auctionId) {
      await supabase.from("auctions").update({ title: name, description: description || null }).eq("id", auctionId);
    }

    setSaving(false);
    setNewFiles([]);
    setPhotos([...photos, ...newUrls.map((url, i) => ({ id: `new-${i}`, url, sort_order: photos.length + i }))]);
    router.refresh();
  }

  async function handleCancelListing() {
    setCancelling(true);
    setError("");
    await supabase.from("birds").update({ is_active: false }).eq("id", birdId);
    if (auctionId) {
      await supabase.from("auctions").update({ status: "cancelled" }).eq("id", auctionId);
    }
    setCancelling(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {isCancelled && (
        <div style={{ fontSize: 13, color: "var(--muted)", padding: "12px 16px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2 }}>
          This listing is {auctionStatus}. You can still edit the bird&apos;s details below.
        </div>
      )}

      <div>
        <label style={labelStyle}>Bird name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>

      <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Ring number</label>
          <input value={ringNumber} onChange={(e) => setRingNumber(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
            <option value="cock">Cock</option>
            <option value="hen">Hen</option>
          </select>
        </div>
      </div>

      <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} style={inputStyle} />
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
          onChange={(e) => { setNewFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {photos.map((p, i) => (
            <div key={p.id} style={{ position: "relative", width: 88, height: 88, borderRadius: 2, overflow: "hidden", border: `1px solid ${i === 0 ? "var(--gold)" : "var(--border)"}` }}>
              <Image src={p.url} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
            </div>
          ))}
          {newFiles.map((f, i) => (
            <div key={`new-${i}`} style={{ position: "relative", width: 88, height: 88, borderRadius: 2, overflow: "hidden", border: "1px dashed var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--gold)", textAlign: "center", padding: 4 }}>
              {f.name} (new)
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: 88, height: 88, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "var(--deep)", border: "1px dashed var(--border-gold)", borderRadius: 2, color: "var(--gold)", cursor: "pointer", fontSize: 11 }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Add More
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
      </div>

      {error && <div style={{ color: "#E74C3C", fontSize: 13, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: 2, border: "0.5px solid rgba(231,76,60,0.3)" }}>{error}</div>}

      <button className="btn-gold-lg" onClick={handleSave} disabled={saving} style={{ width: "100%", textAlign: "center" }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>

      {!isCancelled && auctionId && (
        <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 20 }}>
          {!confirmCancel ? (
            <button type="button" onClick={() => setConfirmCancel(true)} style={{ width: "100%", padding: 12, background: "none", border: "0.5px solid rgba(231,76,60,0.4)", color: "#E74C3C", fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", borderRadius: 2, cursor: "pointer" }}>
              Cancel Listing
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>This will end the auction and remove the bird from Browse. This can&apos;t be undone. Are you sure?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setConfirmCancel(false)} className="btn-ghost" style={{ flex: 1 }}>Keep Listing</button>
                <button type="button" onClick={handleCancelListing} disabled={cancelling} style={{ flex: 1, background: "#E74C3C", color: "var(--white)", border: "none", padding: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 2 }}>
                  {cancelling ? "Cancelling…" : "Yes, Cancel It"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
