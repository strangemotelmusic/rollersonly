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
} from "@/app/actions/dots-birds-admin";
import { formatPrice } from "@/lib/dots-birds";
import BulkDotsBirdDrop from "./BulkDotsBirdDrop";

type Bird = {
  id: string;
  name: string;
  band_number: string | null;
  age: string | null;
  price_cents: number;
  description: string | null;
  photo_url: string | null;
  is_available: boolean;
};

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

export default function DotsBirdsAdminClient({ initialBirds }: { initialBirds: Bird[] }) {
  const [birds, setBirds] = useState(initialBirds);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          className="btn-gold"
          style={{ padding: "10px 22px" }}
          onClick={() => {
            setShowAddForm((s) => !s);
            setShowBulk(false);
          }}
        >
          {showAddForm ? "Cancel" : "+ Add New Bird"}
        </button>
        <button
          className="btn-ghost"
          style={{ padding: "10px 22px", cursor: "pointer" }}
          onClick={() => {
            setShowBulk((s) => !s);
            setShowAddForm(false);
          }}
        >
          {showBulk ? "Cancel Bulk Import" : "🕊️ Bulk Import Photos"}
        </button>
      </div>

      {showBulk && <BulkDotsBirdDrop />}

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

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            onDelete={() => setBirds((prev) => prev.filter((b) => b.id !== bird.id))}
          />
        ))}
      </div>
    </div>
  );
}

function BirdRow({
  bird,
  onAvailabilityChange,
  onDelete,
}: {
  bird: Bird;
  onAvailabilityChange: (isAvailable: boolean) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
        {bird.photo_url && <Image src={bird.photo_url} alt={bird.name} fill style={{ objectFit: "cover", opacity: bird.is_available ? 1 : 0.4 }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 4 }}>
          {bird.name} {!bird.is_available && <span style={{ fontSize: 11, color: "var(--muted)" }}>(Sold)</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          {[bird.band_number && `Band #${bird.band_number}`, bird.age].filter(Boolean).join(" · ")}
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
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Description</label>
        <textarea name="description" defaultValue={bird?.description ?? ""} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{bird ? "Replace Photo (optional)" : "Photo"}</label>
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
