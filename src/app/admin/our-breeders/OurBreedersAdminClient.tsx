"use client";

import { useState } from "react";
import Image from "next/image";
import { createOurBreeder, updateOurBreeder, removeOurBreederPhoto, deleteOurBreeder } from "@/app/actions/our-breeders-admin";

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
  sort_order: number;
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
          onSubmit={async (formData) => {
            const result = await createOurBreeder(formData);
            if ("error" in result) return result;
            window.location.reload();
            return result;
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {breeders.length === 0 && !showAddForm && <p style={{ fontSize: 14, color: "var(--muted)" }}>No breeders added yet.</p>}
        {breeders.map((b) => (
          <BreederRow key={b.id} breeder={b} onDelete={() => setBreeders((prev) => prev.filter((x) => x.id !== b.id))} />
        ))}
      </div>
    </div>
  );
}

function BreederRow({ breeder, onDelete }: { breeder: Breeder; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        onSubmit={async (formData) => {
          const result = await updateOurBreeder(breeder.id, formData);
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
        {breeder.photo_urls[0] && <Image src={breeder.photo_urls[0]} alt={breeder.name} fill style={{ objectFit: "cover" }} />}
      </div>
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
}: {
  breeder?: Breeder;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState(breeder?.photo_urls ?? []);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    setPending(false);
    if ("error" in result) setError(result.error);
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
          <label style={labelStyle}>Existing Photos</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {photoUrls.map((url) => (
              <div key={url} style={{ position: "relative", width: 72, height: 72, borderRadius: 2, overflow: "hidden", border: "0.5px solid var(--border)" }}>
                <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
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
          {pending ? "Saving…" : breeder ? "Save Changes" : "Add Breeder"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
