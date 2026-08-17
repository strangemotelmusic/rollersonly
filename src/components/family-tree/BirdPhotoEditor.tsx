"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { cropImageStyle, DEFAULT_CROP, type PhotoCropSettings } from "@/lib/our-breeders/crop";
import { updateFamilyTreeBirdPhotoSettings } from "@/lib/family-tree/birds";

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  display: "block",
  marginBottom: 6,
};

/**
 * Click-to-view/drag-to-crop photo editor, same pattern as
 * src/app/admin/our-breeders/OurBreedersAdminClient.tsx's PhotoEditorModal,
 * retargeted at family_tree_birds.photo_settings.
 */
export default function BirdPhotoEditor({
  birdId,
  url,
  initialCrop,
  onClose,
  onSaved,
}: {
  birdId: string;
  url: string;
  initialCrop: PhotoCropSettings;
  onClose: () => void;
  onSaved: (settings: PhotoCropSettings) => void;
}) {
  const supabase = createClient();
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
    const result = await updateFamilyTreeBirdPhotoSettings(supabase, birdId, url, crop);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(crop);
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
          <label style={labelStyle}>How It Will Appear — drag to reposition</label>
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
