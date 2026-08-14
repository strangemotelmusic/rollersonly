"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleArchiveLike, addArchiveComment, deleteArchiveComment } from "@/app/actions/archive";

type Profile = { username: string; full_name: string | null; avatar_url: string | null };

type ArchiveItem = {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  created_at: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
};

type Filter = "all" | "image" | "video";

export default function SpinVaultClient({
  currentUserId,
  initialItems,
}: {
  currentUserId: string;
  initialItems: ArchiveItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const filtered = items.filter((i) => filter === "all" || i.media_type === filter);
  const lightboxIndex = filtered.findIndex((i) => i.id === lightboxId);
  const lightboxItem = lightboxIndex >= 0 ? filtered[lightboxIndex] : null;

  function updateItem(id: string, patch: Partial<ArchiveItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function handleToggleLike(item: ArchiveItem) {
    const wasLiked = item.likedByMe;
    updateItem(item.id, { likedByMe: !wasLiked, likeCount: item.likeCount + (wasLiked ? -1 : 1) });
    const result = await toggleArchiveLike(item.id);
    if ("error" in result) {
      updateItem(item.id, { likedByMe: wasLiked, likeCount: item.likeCount });
    }
  }

  function openAt(index: number) {
    if (index < 0 || index >= filtered.length) return;
    setLightboxId(filtered[index].id);
  }

  useEffect(() => {
    if (!lightboxItem) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxId(null);
      if (e.key === "ArrowRight") openAt(lightboxIndex + 1);
      if (e.key === "ArrowLeft") openAt(lightboxIndex - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxItem, lightboxIndex]);

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 32px 100px" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>
          The Rollers Only Archive
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 44, fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>
          The Spin Vault
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32, maxWidth: 620 }}>
          Decades of kits, breaks, and championship lofts — browse the full archive, like your favorites, and
          drop a comment.
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {(["all", "image", "video"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 18px",
                fontSize: 12,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: 2,
                cursor: "pointer",
                background: filter === f ? "var(--gold)" : "transparent",
                color: filter === f ? "var(--black)" : "var(--muted)",
                border: filter === f ? "none" : "0.5px solid var(--border)",
              }}
            >
              {f === "all" ? "All" : f === "image" ? "Photos" : "Videos"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>Nothing here yet — check back soon.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {filtered.map((item, index) => (
              <GridCard key={item.id} item={item} onOpen={() => openAt(index)} onToggleLike={() => handleToggleLike(item)} />
            ))}
          </div>
        )}
      </div>

      {lightboxItem && (
        <Lightbox
          item={lightboxItem}
          currentUserId={currentUserId}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < filtered.length - 1}
          onPrev={() => openAt(lightboxIndex - 1)}
          onNext={() => openAt(lightboxIndex + 1)}
          onClose={() => setLightboxId(null)}
          onToggleLike={() => handleToggleLike(lightboxItem)}
          onCommentCountChange={(delta) => updateItem(lightboxItem.id, { commentCount: lightboxItem.commentCount + delta })}
        />
      )}
    </div>
  );
}

function GridCard({ item, onOpen, onToggleLike }: { item: ArchiveItem; onOpen: () => void; onToggleLike: () => void }) {
  const thumb = item.media_type === "video" ? item.thumbnail_url : item.media_url;

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden" }}>
      <button
        onClick={onOpen}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          background: "var(--void)",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "block",
        }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
            No preview
          </div>
        )}
        {item.media_type === "video" && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              color: "rgba(255,255,255,0.85)",
              background: "rgba(0,0,0,0.15)",
            }}
          >
            ▶
          </span>
        )}
      </button>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 13, color: "var(--white)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button
            onClick={onToggleLike}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span style={{ fontSize: 15, color: item.likedByMe ? "var(--gold)" : "var(--muted)" }}>{item.likedByMe ? "♥" : "♡"}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.likeCount}</span>
          </button>
          <button onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>💬</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Lightbox({
  item,
  currentUserId,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onToggleLike,
  onCommentCountChange,
}: {
  item: ArchiveItem;
  currentUserId: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onToggleLike: () => void;
  onCommentCountChange: (delta: number) => void;
}) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setComments(null);
    setCommentInput("");
    setError(null);
    let cancelled = false;
    supabase
      .from("archive_comments")
      .select("id, body, created_at, user_id, profiles(username, full_name, avatar_url)")
      .eq("archive_id", item.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setComments((data as unknown as Comment[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function handlePostComment() {
    const trimmed = commentInput.trim();
    if (!trimmed) return;
    setPosting(true);
    setError(null);
    const result = await addArchiveComment(item.id, trimmed);
    setPosting(false);
    if (!("comment" in result) || !result.comment) {
      setError(("error" in result && result.error) || "Could not post comment.");
      return;
    }
    setComments((prev) => [...(prev ?? []), result.comment as unknown as Comment]);
    onCommentCountChange(1);
    setCommentInput("");
  }

  async function handleDeleteComment(commentId: string) {
    setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
    onCommentCountChange(-1);
    await deleteArchiveComment(commentId);
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 20, right: 24, fontSize: 20, background: "none", border: "none", color: "var(--white)", cursor: "pointer" }}
      >
        ✕
      </button>
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 28, background: "none", border: "none", color: "var(--white)", cursor: "pointer" }}
        >
          ‹
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 28, background: "none", border: "none", color: "var(--white)", cursor: "pointer" }}
        >
          ›
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", maxWidth: "94vw", maxHeight: "88vh", background: "var(--deep)", border: "0.5px solid var(--border-gold)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--black)", maxWidth: "62vw" }}>
          {item.media_type === "video" ? (
            <video src={item.media_url} controls autoPlay style={{ maxWidth: "62vw", maxHeight: "88vh", display: "block" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.media_url} alt={item.title} style={{ maxWidth: "62vw", maxHeight: "88vh", display: "block", objectFit: "contain" }} />
          )}
        </div>

        <div style={{ width: 340, display: "flex", flexDirection: "column", borderLeft: "0.5px solid var(--border)" }}>
          <div style={{ padding: 20, borderBottom: "0.5px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)", marginBottom: 8 }}>{item.title}</h2>
            {item.description && <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>{item.description}</p>}
            <button
              onClick={onToggleLike}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span style={{ fontSize: 18, color: item.likedByMe ? "var(--gold)" : "var(--muted)" }}>{item.likedByMe ? "♥" : "♡"}</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{item.likeCount} {item.likeCount === 1 ? "like" : "likes"}</span>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            {comments === null ? (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Loading comments…</span>
            ) : comments.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>No comments yet — say something.</span>
            ) : (
              comments.map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>
                      {c.profiles?.full_name || c.profiles?.username || "Member"}
                    </span>
                    {c.user_id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        style={{ fontSize: 11, color: "var(--subtle)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--white)", marginTop: 2 }}>{c.body}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 16, borderTop: "0.5px solid var(--border)" }}>
            {error && <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                placeholder="Add a comment…"
                style={{ flex: 1, background: "var(--surface)", border: "none", color: "var(--white)", padding: "10px 14px", fontSize: 13, borderRadius: 2, outline: "none" }}
              />
              <button
                onClick={handlePostComment}
                disabled={posting}
                className="btn-gold"
                style={{ padding: "10px 16px", fontSize: 12, opacity: posting ? 0.6 : 1 }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
