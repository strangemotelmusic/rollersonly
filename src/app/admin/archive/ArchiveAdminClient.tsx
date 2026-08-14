"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createArchiveItem, updateArchiveItem, deleteArchiveItem } from "@/app/actions/archive-admin";
import { enhanceImage, remasterVideo } from "@/lib/archive/enhance";
import {
  MAX_ARCHIVE_IMAGE_BYTES,
  ALLOWED_ARCHIVE_IMAGE_TYPES,
  MAX_ARCHIVE_VIDEO_BYTES,
  MAX_ARCHIVE_VIDEO_SECONDS,
  MAX_ARCHIVE_VIDEO_INPUT_BYTES,
} from "@/lib/archive/constants";

type ArchiveItem = {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  created_at: string;
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

// Grabs a frame from a video File as a JPEG File — used as the grid
// thumbnail for video items so the gallery never shows a blank box.
async function captureVideoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.style.display = "none";
    document.body.appendChild(video);

    let settled = false;
    function cleanup() {
      video.remove();
      URL.revokeObjectURL(url);
    }
    function fail() {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2 || 0);
    };
    video.onseeked = () => {
      if (settled) return;
      settled = true;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob ? new File([blob], "thumbnail.jpg", { type: "image/jpeg" }) : null);
        },
        "image/jpeg",
        0.85
      );
    };
    video.onerror = fail;
    setTimeout(fail, 8000);
    video.src = url;
  });
}

export default function ArchiveAdminClient({
  currentUserId,
  initialItems,
}: {
  currentUserId: string;
  initialItems: ArchiveItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <button
        className="btn-gold"
        style={{ padding: "10px 22px", marginBottom: 24 }}
        onClick={() => setShowAddForm((s) => !s)}
      >
        {showAddForm ? "Cancel" : "+ Add Photo or Video"}
      </button>

      {showAddForm && (
        <UploadForm
          currentUserId={currentUserId}
          onDone={() => {
            setShowAddForm(false);
            window.location.reload();
          }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {items.length === 0 && !showAddForm && (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>Nothing in the vault yet.</p>
        )}
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDelete={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, onDelete }: { item: ArchiveItem; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");

  async function handleSave() {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    const result = await updateArchiveItem(item.id, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${item.title}" from the vault? This can't be undone.`)) return;
    setPending(true);
    const result = await deleteArchiveItem(item.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDelete();
  }

  const thumb = item.media_type === "video" ? item.thumbnail_url : item.media_url;

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--void)" }}>
        {thumb && <Image src={thumb} alt={item.title} fill style={{ objectFit: "cover" }} />}
        {item.media_type === "video" && (
          <span style={{ position: "absolute", top: 8, right: 8, fontSize: 11, color: "var(--gold)", background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 2 }}>
            VIDEO
          </span>
        )}
      </div>
      <div style={{ padding: 14 }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            {error && <p style={{ fontSize: 12, color: "#e8a3a3" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave} disabled={pending} className="btn-gold" style={{ padding: "6px 14px", fontSize: 12 }}>
                {pending ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)} disabled={pending} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 4 }}>{item.title}</div>
            {item.description && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4 }}>{item.description}</div>}
            {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(true)} disabled={pending} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={pending}
                style={{ padding: "6px 14px", fontSize: 12, background: "transparent", border: "0.5px solid rgba(232,163,163,0.4)", color: "#e8a3a3", borderRadius: 2, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UploadForm({ currentUserId, onDone }: { currentUserId: string; onDone: () => void }) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFile(files: FileList | null) {
    setError(null);
    const picked = files?.[0];
    if (!picked) return;

    const isImage = ALLOWED_ARCHIVE_IMAGE_TYPES.includes(picked.type);
    const isVideo = picked.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Only images or video files are supported.");
      return;
    }
    if (isImage && picked.size > MAX_ARCHIVE_IMAGE_BYTES) {
      setError("Images must be under 15MB.");
      return;
    }

    if (isImage) {
      setEnhancing(true);
      try {
        const enhanced = await enhanceImage(picked);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(enhanced);
        setMediaType("image");
        setPreviewUrl(URL.createObjectURL(enhanced));
      } catch (err) {
        console.error("[archive enhance] failed", err);
        setError("Could not process this image — try a different file.");
      } finally {
        setEnhancing(false);
      }
      return;
    }

    // Every archive video is re-encoded through the remaster filter chain
    // (denoise/color-correct/sharpen), not just ones in an unsupported
    // format — the goal here is "make old footage look good," not just
    // "make it playable."
    if (picked.size > MAX_ARCHIVE_VIDEO_INPUT_BYTES) {
      setError("That video file is too large to process — try a smaller export.");
      return;
    }
    setConverting(true);
    setConversionProgress(0);
    try {
      const remastered = await remasterVideo(picked, MAX_ARCHIVE_VIDEO_SECONDS, setConversionProgress);
      if (remastered.size > MAX_ARCHIVE_VIDEO_BYTES) {
        setError("That video is still too large after processing.");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(remastered);
      setMediaType("video");
      setPreviewUrl(URL.createObjectURL(remastered));
    } catch (err) {
      console.error("[archive remaster] failed", err);
      setError("Could not process this video — try a different file.");
    } finally {
      setConverting(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!file || !mediaType) {
      setError("Choose a photo or video first.");
      return;
    }

    setUploading(true);
    try {
      const path = `${currentUserId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("archive-media").upload(path, file);
      if (uploadErr) {
        setError(`Upload failed: ${uploadErr.message}`);
        return;
      }
      const mediaUrl = supabase.storage.from("archive-media").getPublicUrl(path).data.publicUrl;

      let thumbnailUrl = "";
      if (mediaType === "video") {
        const thumbFile = await captureVideoThumbnail(file);
        if (thumbFile) {
          const thumbPath = `${currentUserId}/${crypto.randomUUID()}-thumb.jpg`;
          const { error: thumbErr } = await supabase.storage.from("archive-media").upload(thumbPath, thumbFile);
          if (!thumbErr) thumbnailUrl = supabase.storage.from("archive-media").getPublicUrl(thumbPath).data.publicUrl;
        }
      }

      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("mediaUrl", mediaUrl);
      formData.set("mediaType", mediaType);
      formData.set("thumbnailUrl", thumbnailUrl);

      const result = await createArchiveItem(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    } finally {
      setUploading(false);
    }
  }

  const busy = enhancing || converting || uploading;

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24, marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Description (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Photo or Video</label>
        <input
          type="file"
          accept={[...ALLOWED_ARCHIVE_IMAGE_TYPES, "video/*"].join(",")}
          onChange={(e) => {
            pickFile(e.target.files);
            e.target.value = "";
          }}
          disabled={busy}
          style={{ fontSize: 13, color: "var(--muted)" }}
        />
        <p style={{ fontSize: 11, color: "var(--subtle)", marginTop: 6 }}>
          Every upload is automatically remastered — auto color/contrast correction, denoising, and sharpening.
        </p>
      </div>

      {enhancing && <div style={{ marginBottom: 16, fontSize: 12, color: "var(--gold)" }}>Remastering photo…</div>}

      {converting && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--gold)", marginBottom: 4 }}>Remastering video… {Math.round(conversionProgress * 100)}%</div>
          <div style={{ height: 3, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(conversionProgress * 100)}%`, background: "var(--gold)", transition: "width 0.2s ease" }} />
          </div>
        </div>
      )}

      {previewUrl && !converting && (
        <div style={{ marginBottom: 16 }}>
          {mediaType === "video" ? (
            <video src={previewUrl} controls style={{ maxWidth: 240, maxHeight: 240, borderRadius: 4, display: "block" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" style={{ maxWidth: 240, maxHeight: 240, borderRadius: 4, display: "block" }} />
          )}
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}

      <button onClick={handleSubmit} disabled={busy} className="btn-gold" style={{ padding: "10px 24px", opacity: busy ? 0.6 : 1 }}>
        {uploading ? "Uploading…" : converting ? "Remastering…" : enhancing ? "Remastering…" : "Add to Vault"}
      </button>
    </div>
  );
}
