"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDotsBird } from "@/app/actions/dots-birds-admin";
import { uploadAdminImage } from "@/lib/admin-uploads";

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  bandNumber: string;
  age: string;
  price: string;
  description: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--void)",
  border: "0.5px solid var(--border)",
  color: "var(--white)",
  padding: "8px 10px",
  fontSize: 13,
  borderRadius: 2,
  outline: "none",
};

const smallLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  display: "block",
  marginBottom: 4,
};

function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BulkDotsBirdDrop() {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    const newItems: Item[] = images.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      name: nameFromFilename(file.name),
      bandNumber: "",
      age: "",
      price: "",
      description: "",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const missingRequired = items.filter((it) => !it.name.trim() || !it.price.trim() || Number(it.price) <= 0);

  async function saveAll() {
    if (missingRequired.length > 0) {
      setError(`${missingRequired.length} bird${missingRequired.length === 1 ? "" : "s"} still need a name and price before saving.`);
      return;
    }

    setSaving(true);
    setError(null);
    setProgress(0);
    const failures: string[] = [];
    let done = 0;
    let index = 0;

    async function saveWorker() {
      while (index < items.length) {
        const it = items[index++];
        const uploaded = await uploadAdminImage(supabase, "dots-birds", it.file);
        if ("error" in uploaded) {
          failures.push(`"${it.name}": ${uploaded.error}`);
          done++;
          setProgress(done);
          continue;
        }
        const fd = new FormData();
        fd.set("name", it.name.trim());
        fd.set("bandNumber", it.bandNumber.trim());
        fd.set("age", it.age.trim());
        fd.set("description", it.description.trim());
        fd.set("price", it.price.trim());
        fd.set("photoUrl", uploaded.url);
        const result = await createDotsBird(fd);
        if ("error" in result) failures.push(`"${it.name}": ${result.error}`);
        done++;
        setProgress(done);
      }
    }

    await Promise.all(Array.from({ length: Math.min(4, items.length) }, saveWorker));

    setSaving(false);
    if (failures.length > 0) {
      setError(`${failures.length} of ${items.length} failed to save — fix and try again:\n${failures.join("\n")}`);
      return;
    }
    window.location.reload();
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? "var(--gold)" : "var(--border-gold)"}`,
          background: dragging ? "rgba(212,175,55,0.08)" : "var(--surface)",
          borderRadius: 4,
          padding: "36px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 8 }}>🕊️</div>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 6 }}>Drop all your bird photos here</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Or click to choose several at once — full original resolution, no compression. Set a name and price for
          each before saving.
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>

      {items.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 14px" }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {items.length} bird{items.length === 1 ? "" : "s"} ready
              {missingRequired.length > 0 && ` · ${missingRequired.length} need a name/price`}
            </div>
            <button
              onClick={saveAll}
              disabled={saving}
              className="btn-gold"
              style={{ padding: "10px 22px", opacity: saving ? 0.5 : 1 }}
            >
              {saving ? `Saving… ${progress}/${items.length}` : `Save All ${items.length}`}
            </button>
          </div>

          {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 12, whiteSpace: "pre-line" }}>{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((it) => {
              const flagged = !it.name.trim() || !it.price.trim() || Number(it.price) <= 0;
              return (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    background: "var(--surface)",
                    border: flagged ? "0.5px solid rgba(232,163,163,0.4)" : "0.5px solid var(--border)",
                    borderRadius: 2,
                    padding: 14,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.previewUrl} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 2, flexShrink: 0, background: "var(--void)" }} />
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "1 / 3" }}>
                      <label style={smallLabel}>Bird Name</label>
                      <input value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={smallLabel}>Price (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={it.price}
                        onChange={(e) => update(it.id, { price: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={smallLabel}>Band Number</label>
                      <input value={it.bandNumber} onChange={(e) => update(it.id, { bandNumber: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={smallLabel}>Age</label>
                      <input
                        value={it.age}
                        onChange={(e) => update(it.id, { age: e.target.value })}
                        placeholder="e.g. 2024 Young Bird"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ gridColumn: "2 / 5" }}>
                      <label style={smallLabel}>Description (optional)</label>
                      <input value={it.description} onChange={(e) => update(it.id, { description: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(it.id)}
                    disabled={saving}
                    style={{ background: "none", border: "none", color: "var(--subtle)", fontSize: 18, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
