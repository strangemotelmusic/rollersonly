"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadAdminImage } from "@/lib/admin-uploads";
import {
  createDotsBird,
  updateDotsBird,
  setDotsBirdAvailability,
  deleteDotsBird,
  addDotsBirdPhoto,
  removeDotsBirdPhoto,
} from "@/app/actions/dots-birds-admin";
import { addGalleryPhoto, deleteGalleryPhoto } from "@/app/actions/tysons-corner-gallery-admin";
import { formatPrice } from "@/lib/dots-birds";

type Bird = {
  id: string;
  name: string;
  band_number: string | null;
  age: string | null;
  price_cents: number;
  description: string | null;
  photo_url: string | null;
  photo_urls: string[];
  is_available: boolean;
  bloodline: string | null;
};

type GalleryPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

const BLOODLINES = ["Hannes", "Poen", "McKinney"];

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

export default function TysonsCornerAdminClient({
  initialBirds,
  initialGallery,
}: {
  initialBirds: Bird[];
  initialGallery: GalleryPhoto[];
}) {
  const [birds, setBirds] = useState(initialBirds);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 400, color: "var(--white)", marginBottom: 16 }}>
        Birds
      </h2>

      <div style={{ marginBottom: 24 }}>
        <button className="btn-gold" style={{ padding: "10px 22px" }} onClick={() => setShowAddForm((s) => !s)}>
          {showAddForm ? "Cancel" : "+ Add New Bird"}
        </button>
      </div>

      {showAddForm && (
        <BirdForm
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (formData) => {
            const result = await createDotsBird(formData);
            if ("error" in result) return result;
            window.location.reload();
            return result;
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 56 }}>
        {birds.length === 0 && !showAddForm && (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>No birds listed yet.</p>
        )}
        {birds.map((bird) => (
          <BirdRow
            key={bird.id}
            bird={bird}
            onAvailabilityChange={(isAvailable) =>
              setBirds((prev) => prev.map((b) => (b.id === bird.id ? { ...b, is_available: isAvailable } : b)))
            }
            onGalleryChange={(photoUrls) =>
              setBirds((prev) => prev.map((b) => (b.id === bird.id ? { ...b, photo_urls: photoUrls } : b)))
            }
            onDelete={() => setBirds((prev) => prev.filter((b) => b.id !== bird.id))}
          />
        ))}
      </div>

      <GallerySection initialGallery={initialGallery} />
    </div>
  );
}

function BirdRow({
  bird,
  onAvailabilityChange,
  onGalleryChange,
  onDelete,
}: {
  bird: Bird;
  onAvailabilityChange: (isAvailable: boolean) => void;
  onGalleryChange: (photoUrls: string[]) => void;
  onDelete: () => void;
}) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function toggleAvailability() {
    setPending(true);
    const result = await setDotsBirdAvailability(bird.id, !bird.is_available);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onAvailabilityChange(!bird.is_available);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${bird.name}"? This can't be undone.`)) return;
    setPending(true);
    const result = await deleteDotsBird(bird.id);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDelete();
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);
    const uploaded = await uploadAdminImage(supabase, "dots-birds", file);
    if ("error" in uploaded) {
      setUploadingPhoto(false);
      setError(uploaded.error);
      return;
    }

    const result = await addDotsBirdPhoto(bird.id, uploaded.url);
    setUploadingPhoto(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onGalleryChange([...bird.photo_urls, uploaded.url]);
  }

  async function handleRemovePhoto(url: string) {
    setPending(true);
    const result = await removeDotsBirdPhoto(bird.id, url);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onGalleryChange(bird.photo_urls.filter((u) => u !== url));
  }

  if (editing) {
    return (
      <BirdForm
        bird={bird}
        onCancel={() => setEditing(false)}
        onSubmit={async (formData) => {
          const result = await updateDotsBird(bird.id, formData);
          if ("error" in result) return result;
          window.location.reload();
          return result;
        }}
      />
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
          {bird.photo_url && <Image src={bird.photo_url} alt={bird.name} fill style={{ objectFit: "cover", opacity: bird.is_available ? 1 : 0.4 }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 4 }}>
            {bird.name} {!bird.is_available && <span style={{ fontSize: 11, color: "var(--muted)" }}>(Sold)</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            {[bird.band_number && `Band #${bird.band_number}`, bird.age, bird.bloodline && `${bird.bloodline} bloodline`].filter(Boolean).join(" · ")}
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--gold)" }}>{formatPrice(bird.price_cents)}</div>
          {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 6 }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setEditing(true)} disabled={pending} className="btn-ghost" style={{ padding: "8px 16px", cursor: "pointer" }}>
            Edit
          </button>
          <button onClick={toggleAvailability} disabled={pending} className="btn-ghost" style={{ padding: "8px 16px", cursor: "pointer" }}>
            {bird.is_available ? "Mark Sold" : "Mark Available"}
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

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "0.5px solid var(--border)" }}>
        <label style={labelStyle}>Photo Gallery ({bird.photo_urls.length} extra photo{bird.photo_urls.length === 1 ? "" : "s"})</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {bird.photo_urls.map((url) => (
            <div key={url} style={{ position: "relative", width: 64, height: 64, flexShrink: 0, borderRadius: 2, overflow: "hidden", background: "var(--void)" }}>
              <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
              <button
                onClick={() => handleRemovePhoto(url)}
                title="Remove photo"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  lineHeight: "18px",
                  textAlign: "center",
                  fontSize: 11,
                  background: "rgba(0,0,0,0.7)",
                  color: "#e8a3a3",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <label
            style={{
              width: 64,
              height: 64,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed var(--border)",
              borderRadius: 2,
              color: "var(--muted)",
              fontSize: 20,
              cursor: uploadingPhoto ? "default" : "pointer",
            }}
          >
            {uploadingPhoto ? "…" : "+"}
            <input type="file" accept="image/*" onChange={handleAddPhoto} disabled={uploadingPhoto} style={{ display: "none" }} />
          </label>
        </div>
      </div>
    </div>
  );
}

function BirdForm({
  bird,
  onCancel,
  onSubmit,
}: {
  bird?: Bird;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const supabase = createClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");
    formData.delete("file");
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadAdminImage(supabase, "dots-birds", file);
      if ("error" in uploaded) {
        setPending(false);
        setError(uploaded.error);
        return;
      }
      formData.set("photoUrl", uploaded.url);
    }

    const result = await onSubmit(formData);
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Bird Name</label>
          <input name="name" defaultValue={bird?.name} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Price (USD)</label>
          <input name="price" type="number" step="0.01" min="0.01" defaultValue={bird ? bird.price_cents / 100 : ""} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Band Number</label>
          <input name="bandNumber" defaultValue={bird?.band_number ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Age</label>
          <input name="age" placeholder="e.g. 2024 Young Bird" defaultValue={bird?.age ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bloodline</label>
          <select name="bloodline" defaultValue={bird?.bloodline ?? BLOODLINES[0]} style={inputStyle}>
            {BLOODLINES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Description</label>
        <textarea name="description" defaultValue={bird?.description ?? ""} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{bird ? "Replace Primary Photo (optional)" : "Primary Photo"}</label>
        <input name="file" type="file" accept="image/*" style={{ fontSize: 13, color: "var(--muted)" }} />
      </div>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending} className="btn-gold" style={{ padding: "10px 24px" }}>
          {pending ? "Saving…" : bird ? "Save Changes" : "Add Bird"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function GallerySection({ initialGallery }: { initialGallery: GalleryPhoto[] }) {
  const supabase = createClient();
  const [gallery, setGallery] = useState(initialGallery);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    const uploaded = await uploadAdminImage(supabase, "tysons-corner-gallery", file);
    if ("error" in uploaded) {
      setUploading(false);
      setError(uploaded.error);
      return;
    }

    const result = await addGalleryPhoto(uploaded.url, caption);
    setUploading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setGallery((prev) => [
      { id: crypto.randomUUID(), image_url: uploaded.url, caption: caption.trim() || null, sort_order: 0, created_at: new Date().toISOString() },
      ...prev,
    ]);
    setCaption("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this gallery photo?")) return;
    const result = await deleteGalleryPhoto(id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setGallery((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 400, color: "var(--white)", marginBottom: 8 }}>
        General Gallery
      </h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
        Loft and lifestyle photos shown in the gallery on the public Tyson&apos;s Corner page — not tied to a specific
        bird for sale.
      </p>

      <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, marginBottom: 24 }}>
        <label style={labelStyle}>Caption (optional)</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. The Tyson loft, September 2026"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <label
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: uploading ? "var(--border)" : "var(--gold)",
            color: "var(--black)",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 2,
            cursor: uploading ? "default" : "pointer",
          }}
        >
          {uploading ? "Uploading…" : "+ Upload Photo"}
          <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
        </label>
        {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginTop: 12 }}>{error}</p>}
      </div>

      {gallery.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>No gallery photos yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {gallery.map((photo) => (
            <div key={photo.id} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--void)" }}>
                <Image src={photo.image_url} alt={photo.caption ?? ""} fill style={{ objectFit: "cover" }} />
                <button
                  onClick={() => handleDelete(photo.id)}
                  title="Delete photo"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    lineHeight: "24px",
                    textAlign: "center",
                    fontSize: 13,
                    background: "rgba(0,0,0,0.7)",
                    color: "#e8a3a3",
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
              {photo.caption && (
                <div style={{ padding: "8px 10px", fontSize: 11, color: "var(--muted)" }}>{photo.caption}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
