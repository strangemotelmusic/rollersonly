"use client";

import { useRef, useState } from "react";
import { createFutureIssue } from "@/app/actions/future-content-admin";
import { extractCoverInfo, infoFromFilename } from "@/lib/future-issues/ocr";

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  releaseLabel: string;
  description: string;
  reading: boolean;
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

export default function BulkCoverDrop() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    const newItems: Item[] = images.map((file) => {
      const fallback = infoFromFilename(file.name);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        title: fallback.title,
        releaseLabel: fallback.releaseLabel,
        description: "",
        reading: true,
      };
    });
    setItems((prev) => [...prev, ...newItems]);

    // OCR each cover in the background, filling in whatever it can read. If OCR
    // fails or reads nothing, the filename-derived values already in place stay.
    for (const it of newItems) {
      try {
        const info = await extractCoverInfo(it.file);
        update(it.id, {
          title: info.title || it.title,
          releaseLabel: info.releaseLabel || it.releaseLabel,
          reading: false,
        });
      } catch {
        update(it.id, { reading: false });
      }
    }
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

  async function saveAll() {
    setSaving(true);
    setError(null);
    setProgress(0);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const fd = new FormData();
      fd.set("title", it.title.trim() || "Untitled Issue");
      fd.set("releaseLabel", it.releaseLabel.trim());
      fd.set("description", it.description.trim());
      fd.set("file", it.file);
      const result = await createFutureIssue(fd);
      if ("error" in result) {
        setError(`Failed on "${it.title}": ${result.error}`);
        setSaving(false);
        return;
      }
      setProgress(i + 1);
    }
    window.location.reload();
  }

  const anyReading = items.some((it) => it.reading);

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
        <div style={{ fontSize: 26, marginBottom: 8 }}>📚</div>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 6 }}>Drop all your future covers here</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Or click to choose several at once — the title and release date are read off each cover automatically.
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
              {items.length} cover{items.length === 1 ? "" : "s"} ready
              {anyReading && " · reading covers…"}
            </div>
            <button
              onClick={saveAll}
              disabled={saving || anyReading}
              className="btn-gold"
              style={{ padding: "10px 22px", opacity: saving || anyReading ? 0.5 : 1 }}
            >
              {saving ? `Saving… ${progress}/${items.length}` : `Save All ${items.length}`}
            </button>
          </div>

          {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 12 }}>{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" style={{ width: 70, height: 96, objectFit: "cover", borderRadius: 2, flexShrink: 0, background: "var(--void)" }} />
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={smallLabel}>Title {it.reading && <span style={{ color: "var(--gold)" }}>· reading…</span>}</label>
                    <input value={it.title} onChange={(e) => update(it.id, { title: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={smallLabel}>Release Label</label>
                    <input value={it.releaseLabel} onChange={(e) => update(it.id, { releaseLabel: e.target.value })} placeholder="e.g. Spring 2027" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={smallLabel}>Teaser (optional)</label>
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
            ))}
          </div>
        </>
      )}
    </div>
  );
}
