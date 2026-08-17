"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createOurBreeder, updateOurBreeder, removeOurBreederPhoto, deleteOurBreeder, updateOurBreederPhotoSettings } from "@/app/actions/our-breeders-admin";
import { asPhotoSettingsMap, cropFor, cropImageStyle, DEFAULT_CROP, type PhotoCropSettings, type PhotoSettingsMap } from "@/lib/our-breeders/crop";

type Breeder = {
  id: string;
  name: string;
  sex: string | null;
  color: string | null;
  bloodline: string | null;
  ring_number: string | null;
  flying_record: string | null;
  loft_record: string | null;
  bio: string | null;
  photo_urls: string[];
  photo_settings: PhotoSettingsMap;
  sort_order: number;
};

// Server actions return photo_settings typed as the generic Supabase Json — normalize to PhotoSettingsMap at the boundary.
type RawBreeder = Omit<Breeder, "photo_settings"> & { photo_settings: unknown };
function normalizeBreeder(b: RawBreeder): Breeder {
  return { ...b, photo_settings: asPhotoSettingsMap(b.photo_settings) };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--void)",
  border: "0.5px solid var(--border)",
  color: "var(--white)",
  padding: "10px 12px",
  fontSize: 13,
  borderRadius: 2,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 6,
};

export default function OurBreedersAdminClient({ initialBreeders }: { initialBreeders: Breeder[] }) {
  const [breeders, setBreeders] = useState(initialBreeders);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <button className="btn-gold" style={{ padding: "10px 22px", marginBottom: 24 }} onClick={() => setShowAddForm((s) => !s)}>
        {showAddForm ? "Cancel" : "+ Add New Breeder"}
      </button>

      {showAddForm && (
        <BreederForm
          onCancel={() => setShowAddForm(false)}
          onSubmit={(formData) => createOurBreeder(formData)}
          onSaved={(breeder) => {
            setBreeders((prev) => [...prev, breeder]);
            setShowAddForm(false);
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {breeders.length === 0 && !showAddForm && <p style={{ fontSize: 14, color: "var(--muted)" }}>No breeders added yet.</p>}
        {breeders.map((b) => (
          <BreederRow
            key={b.id}
            breeder={b}
            onDelete={() => setBreeders((prev) => prev.filter((x) => x.id !== b.id))}
            onSaved={(updated) => setBreeders((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
          />
        ))}
      </div>
    </div>
  );
}

function BreederRow({
  breeder,
  onDelete,
  onSaved,
}: {
  breeder: Breeder;
  onDelete: () => void;
  onSaved: (breeder: Breeder) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${breeder.name}"? This can't be undone.`)) return;
    setPending(true);
    const result = await deleteOurBreeder(breeder.id);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDelete();
  }

  if (editing) {
    return (
      <BreederForm
        breeder={breeder}
        onCancel={() => setEditing(false)}
        onSubmit={(formData) => updateOurBreeder(breeder.id, formData)}
        onSaved={(updated) => {
          onSaved(updated);
          setEditing(false);
        }}
        onPhotoSettingsSaved={onSaved}
      />
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <button
        type="button"
        onClick={() => breeder.photo_urls[0] && setEditingPhoto(true)}
        disabled={!breeder.photo_urls[0]}
        title={breeder.photo_urls[0] ? "Click to view full size and adjust crop" : undefined}
        style={{
          position: "relative",
          width: 90,
          height: 90,
          flexShrink: 0,
          background: "var(--void)",
          borderRadius: 2,
          overflow: "hidden",
          padding: 0,
          border: "0.5px solid var(--border)",
          cursor: breeder.photo_urls[0] ? "pointer" : "default",
        }}
      >
        {breeder.photo_urls[0] && (
          <Image src={breeder.photo_urls[0]} alt={breeder.name} fill style={cropImageStyle(cropFor(breeder.photo_settings, breeder.photo_urls[0]))} />
        )}
      </button>
      {editingPhoto && breeder.photo_urls[0] && (
        <PhotoEditorModal
          breederId={breeder.id}
          url={breeder.photo_urls[0]}
          initialCrop={cropFor(breeder.photo_settings, breeder.photo_urls[0])}
          onClose={() => setEditingPhoto(false)}
          onSaved={onSaved}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 4 }}>
          {breeder.name} {breeder.sex && <span style={{ fontSize: 11, color: "var(--muted)" }}>({breeder.sex})</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          {[breeder.color, breeder.bloodline, breeder.ring_number].filter(Boolean).join(" · ")}
        </div>
        <div style={{ fontSize: 11, color: "var(--gold)" }}>{breeder.photo_urls.length} photo{breeder.photo_urls.length === 1 ? "" : "s"}</div>
        {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 6 }}>{error}</p>}
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} disabled={pending} className="btn-ghost" style={{ padding: "8px 16px", cursor: "pointer" }}>
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{ padding: "8px 16px", background: "transparent", border: "0.5px solid rgba(232,163,163,0.4)", color: "#e8a3a3", borderRadius: 2, cursor: "pointer", fontSize: 13 }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function BreederForm({
  breeder,
  onCancel,
  onSubmit,
  onSaved,
  onPhotoSettingsSaved,
}: {
  breeder?: Breeder;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<{ error: string } | { ok: true; breeder: RawBreeder }>;
  onSaved: (breeder: Breeder) => void;
  onPhotoSettingsSaved?: (breeder: Breeder) => void;
}) {
  const [pending, setPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState(breeder?.photo_urls ?? []);
  const [photoSettings, setPhotoSettings] = useState<PhotoSettingsMap>(breeder?.photo_settings ?? {});
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    formData.delete("files");

    if (files.length > 0) {
      setUploadProgress({ done: 0, total: files.length });
      const supabase = createClient();
      let done = 0;
      const uploads = await Promise.all(
        files.map(async (file) => {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("our-breeders-photos").upload(path, file);
          done += 1;
          setUploadProgress({ done, total: files.length });
          if (uploadErr) return { error: uploadErr.message };
          return { url: supabase.storage.from("our-breeders-photos").getPublicUrl(path).data.publicUrl };
        })
      );
      const failed = uploads.find((u): u is { error: string } => "error" in u);
      if (failed) {
        setPending(false);
        setUploadProgress(null);
        setError(`Photo upload failed: ${failed.error}`);
        return;
      }
      const urls = uploads.map((u) => (u as { url: string }).url);
      formData.set("newPhotoUrls", JSON.stringify(urls));
      setUploadProgress(null);
    }

    const result = await onSubmit(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(normalizeBreeder(result.breeder));
  }

  async function handleRemovePhoto(url: string) {
    if (!breeder) return;
    setRemovingUrl(url);
    const result = await removeOurBreederPhoto(breeder.id, url);
    setRemovingUrl(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input name="name" defaultValue={breeder?.name} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sex</label>
          <select name="sex" defaultValue={breeder?.sex ?? ""} style={inputStyle}>
            <option value="">—</option>
            <option value="cock">Cock</option>
            <option value="hen">Hen</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input name="color" placeholder="e.g. Blue Bar" defaultValue={breeder?.color ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bloodline</label>
          <input name="bloodline" placeholder="e.g. World Cup Line" defaultValue={breeder?.bloodline ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ring Number</label>
          <input name="ringNumber" defaultValue={breeder?.ring_number ?? ""} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Performance in the Air (flying record)</label>
        <textarea name="flyingRecord" defaultValue={breeder?.flying_record ?? ""} rows={3} placeholder="e.g. 97/100 NBRC Champion 2025, World Cup Finalist 2024…" style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Performance in the Loft (breeding record)</label>
        <textarea name="loftRecord" defaultValue={breeder?.loft_record ?? ""} rows={3} placeholder="e.g. Sired 12 champion offspring across 4 lofts…" style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Bio</label>
        <textarea name="bio" defaultValue={breeder?.bio ?? ""} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {photoUrls.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Existing Photos — click to view full size &amp; adjust crop</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {photoUrls.map((url) => (
              <div key={url} style={{ position: "relative", width: 72, height: 72, borderRadius: 2, overflow: "hidden", border: "0.5px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setEditingPhotoUrl(url)}
                  style={{ position: "absolute", inset: 0, padding: 0, border: "none", cursor: "pointer" }}
                  title="Click to view full size and adjust crop"
                >
                  <Image src={url} alt="" fill style={cropImageStyle(cropFor(photoSettings, url))} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(url)}
                  disabled={removingUrl === url}
                  style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", fontSize: 10, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{breeder ? "Add More Photos" : "Photos"}</label>
        <input name="files" type="file" accept="image/*" multiple style={{ fontSize: 13, color: "var(--muted)" }} />
      </div>

      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending} className="btn-gold" style={{ padding: "10px 24px" }}>
          {uploadProgress
            ? `Uploading photos… ${uploadProgress.done}/${uploadProgress.total}`
            : pending
              ? "Saving…"
              : breeder
                ? "Save Changes"
                : "Add Breeder"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>

      {breeder && editingPhotoUrl && (
        <PhotoEditorModal
          breederId={breeder.id}
          url={editingPhotoUrl}
          initialCrop={cropFor(photoSettings, editingPhotoUrl)}
          onClose={() => setEditingPhotoUrl(null)}
          onSaved={(updated) => {
            setPhotoSettings(updated.photo_settings);
            onPhotoSettingsSaved?.(updated);
          }}
        />
      )}
    </form>
  );
}

function PhotoEditorModal({
  breederId,
  url,
  initialCrop,
  onClose,
  onSaved,
}: {
  breederId: string;
  url: string;
  initialCrop: PhotoCropSettings;
  onClose: () => void;
  onSaved: (breeder: Breeder) => void;
}) {
  const [crop, setCrop] = useState(initialCrop);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, origX: crop.x, origY: crop.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dyPct = ((e.clientY - dragStart.current.y) / rect.height) * 100;
    setCrop((c) => ({
      ...c,
      x: Math.min(100, Math.max(0, dragStart.current!.origX - dxPct)),
      y: Math.min(100, Math.max(0, dragStart.current!.origY - dyPct)),
    }));
  }

  function endDrag() {
    dragStart.current = null;
    setDragging(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateOurBreederPhotoSettings(breederId, url, crop);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(normalizeBreeder(result.breeder));
    onClose();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          maxWidth: 820,
          width: "100%",
          background: "var(--surface)",
          border: "0.5px solid var(--border-gold)",
          borderRadius: 2,
          padding: 32,
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <label style={labelStyle}>Full Photo</label>
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "#000", borderRadius: 2, overflow: "hidden" }}>
            <Image src={url} alt="" fill style={{ objectFit: "contain" }} sizes="400px" />
          </div>
        </div>

        <div style={{ flex: "1 1 260px" }}>
          <label style={labelStyle}>How Subscribers Will See It — drag to reposition</label>
          <div
            ref={boxRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 280,
              aspectRatio: "1",
              overflow: "hidden",
              borderRadius: 2,
              border: "0.5px solid var(--border-gold)",
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            <Image src={url} alt="" fill style={cropImageStyle(crop)} draggable={false} sizes="280px" />
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={crop.zoom}
              onChange={(e) => setCrop((c) => ({ ...c, zoom: Number(e.target.value) }))}
              style={{ width: "100%" }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginTop: 12 }}>{error}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-gold" style={{ padding: "10px 22px" }}>
              {saving ? "Saving…" : "Save Crop"}
            </button>
            <button type="button" onClick={() => setCrop(DEFAULT_CROP)} disabled={saving} className="btn-ghost" style={{ padding: "10px 18px", cursor: "pointer" }}>
              Reset
            </button>
            <button type="button" onClick={onClose} disabled={saving} className="btn-ghost" style={{ padding: "10px 18px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
