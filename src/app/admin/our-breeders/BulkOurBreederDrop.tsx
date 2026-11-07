"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createOurBreeder } from "@/app/actions/our-breeders-admin";
import { uploadAdminImage } from "@/lib/admin-uploads";

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sex: string;
  color: string;
  bloodline: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--void)",
  border: "0.5px solid var(--border)",
  color: "var(--white)",
  padding: "8px 10px",
  fontSize: 13,
  borderRadius: "var(--radius-sm)",
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

export default function BulkOurBreederDrop({ onSaved }: { onSaved: () => void }) {
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
      sex: "",
      color: "",
      bloodline: "",
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

  const missingRequired = items.filter((it) => !it.name.trim());

  async function saveAll() {
    if (missingRequired.length > 0) {
      setError(`${missingRequired.length} photo${missingRequired.length === 1 ? "" : "s"} still need a name before saving.`);
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
        const uploaded = await uploadAdminImage(supabase, "our-breeders-photos", it.file);
        if ("error" in uploaded) {
          failures.push(`"${it.name}": ${uploaded.error}`);
          done++;
          setProgress(done);
          continue;
        }
        const fd = new FormData();
        fd.set("name", it.name.trim());
        fd.set("sex", it.sex);
        fd.set("color", it.color.trim());
        fd.set("bloodline", it.bloodline.trim());
        fd.set("newPhotoUrls", JSON.stringify([uploaded.url]));
        const result = await createOurBreeder(fd);
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
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
    onSaved();
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
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 6 }}>Drop photos here to add new heroes</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Or click to choose several at once — just name each one and save. You can fill in bloodline, flying record,
          and bio later by hitting Edit.
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
              {items.length} hero{items.length === 1 ? "" : "es"} ready
              {missingRequired.length > 0 && ` · ${missingRequired.length} need a name`}
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
              const flagged = !it.name.trim();
              return (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    background: "var(--surface)",
                    border: flagged ? "0.5px solid rgba(232,163,163,0.4)" : "0.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: 14,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.previewUrl} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0, background: "var(--void)" }} />
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "1 / 3" }}>
                      <label style={smallLabel}>Name</label>
                      <input value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={smallLabel}>Sex</label>
                      <select value={it.sex} onChange={(e) => update(it.id, { sex: e.target.value })} style={inputStyle}>
                        <option value="">—</option>
                        <option value="cock">Cock</option>
                        <option value="hen">Hen</option>
                      </select>
                    </div>
                    <div>
                      <label style={smallLabel}>Color</label>
                      <input value={it.color} onChange={(e) => update(it.id, { color: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / 5" }}>
                      <label style={smallLabel}>Bloodline (optional)</label>
                      <input value={it.bloodline} onChange={(e) => update(it.id, { bloodline: e.target.value })} style={inputStyle} />
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
