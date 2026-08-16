"use client";

import { useState } from "react";
import Image from "next/image";
import {
  createFutureIssue,
  updateFutureIssue,
  deleteFutureIssue,
  addFeaturedVideo,
  addFeaturedVideosBulk,
  deleteFeaturedVideo,
} from "@/app/actions/future-content-admin";

type FutureIssue = {
  id: string;
  title: string;
  release_label: string | null;
  description: string | null;
  cover_url: string | null;
  sort_order: number;
};

type FeaturedVideo = {
  id: string;
  title: string;
  youtube_id: string;
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

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--ff-display)",
  fontSize: 24,
  fontWeight: 300,
  color: "var(--white)",
  marginBottom: 20,
};

export default function FutureIssuesAdminClient({
  initialIssues,
  initialVideos,
}: {
  initialIssues: FutureIssue[];
  initialVideos: FeaturedVideo[];
}) {
  const [issues, setIssues] = useState(initialIssues);
  const [videos, setVideos] = useState(initialVideos);
  const [showIssueForm, setShowIssueForm] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {/* FUTURE ISSUES */}
      <section>
        <div style={sectionTitle}>Future Issue Covers</div>
        <button className="btn-gold" style={{ padding: "10px 22px", marginBottom: 24 }} onClick={() => setShowIssueForm((s) => !s)}>
          {showIssueForm ? "Cancel" : "+ Add Upcoming Issue"}
        </button>

        {showIssueForm && (
          <IssueForm
            onCancel={() => setShowIssueForm(false)}
            onSubmit={async (formData) => {
              const result = await createFutureIssue(formData);
              if ("error" in result) return result;
              window.location.reload();
              return result;
            }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {issues.length === 0 && !showIssueForm && <p style={{ fontSize: 14, color: "var(--muted)" }}>No upcoming issues yet.</p>}
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} onDelete={() => setIssues((prev) => prev.filter((x) => x.id !== issue.id))} />
          ))}
        </div>
      </section>

      {/* FEATURED VIDEOS */}
      <section>
        <div style={sectionTitle}>Big Screen — YouTube Videos</div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, marginTop: -8 }}>
          Videos play one after another on a loop. Add them one at a time with a title, or paste a whole batch below.
        </p>
        <VideoForm
          onAdd={async (formData) => {
            const result = await addFeaturedVideo(formData);
            if ("error" in result) return result;
            window.location.reload();
            return result;
          }}
        />
        <BulkVideoForm
          onAdd={async (formData) => {
            const result = await addFeaturedVideosBulk(formData);
            if ("error" in result) return result;
            window.location.reload();
            return result;
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {videos.length === 0 && <p style={{ fontSize: 14, color: "var(--muted)" }}>No videos added yet — paste a YouTube link above.</p>}
          {videos.map((v) => (
            <VideoRow key={v.id} video={v} onDelete={() => setVideos((prev) => prev.filter((x) => x.id !== v.id))} />
          ))}
        </div>
      </section>
    </div>
  );
}

function IssueRow({ issue, onDelete }: { issue: FutureIssue; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${issue.title}"? This can't be undone.`)) return;
    setPending(true);
    const result = await deleteFutureIssue(issue.id);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDelete();
  }

  if (editing) {
    return (
      <IssueForm
        issue={issue}
        onCancel={() => setEditing(false)}
        onSubmit={async (formData) => {
          const result = await updateFutureIssue(issue.id, formData);
          if ("error" in result) return result;
          window.location.reload();
          return result;
        }}
      />
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ position: "relative", width: 70, height: 96, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
        {issue.cover_url && <Image src={issue.cover_url} alt={issue.title} fill style={{ objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 4 }}>{issue.title}</div>
        {issue.release_label && <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 4 }}>{issue.release_label}</div>}
        {issue.description && <div style={{ fontSize: 12, color: "var(--muted)" }}>{issue.description}</div>}
        {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 6 }}>{error}</p>}
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} disabled={pending} className="btn-ghost" style={{ padding: "8px 16px", cursor: "pointer" }}>Edit</button>
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

function IssueForm({
  issue,
  onCancel,
  onSubmit,
}: {
  issue?: FutureIssue;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await onSubmit(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Issue Title</label>
          <input name="title" defaultValue={issue?.title} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Release Label</label>
          <input name="releaseLabel" placeholder="e.g. Spring 2027" defaultValue={issue?.release_label ?? ""} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Teaser Description</label>
        <textarea name="description" defaultValue={issue?.description ?? ""} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{issue ? "Replace Cover (optional)" : "Cover Image"}</label>
        <input name="file" type="file" accept="image/*" style={{ fontSize: 13, color: "var(--muted)" }} />
      </div>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending} className="btn-gold" style={{ padding: "10px 24px" }}>
          {pending ? "Saving…" : issue ? "Save Changes" : "Add Issue"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>Cancel</button>
      </div>
    </form>
  );
}

function VideoForm({ onAdd }: { onAdd: (formData: FormData) => Promise<{ error: string } | { ok: true }> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await onAdd(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 12, alignItems: "end" }}>
        <div>
          <label style={labelStyle}>Video Title</label>
          <input name="title" required placeholder="World Cup 2026 Highlights" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>YouTube Link</label>
          <input name="link" required placeholder="https://youtube.com/watch?v=…" style={inputStyle} />
        </div>
        <button type="submit" disabled={pending} className="btn-gold" style={{ padding: "10px 22px", whiteSpace: "nowrap" }}>
          {pending ? "Adding…" : "Add Video"}
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--subtle)", marginTop: 10 }}>
        Paste any YouTube link — watch, youtu.be, embed, Shorts, or live all work.
      </p>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginTop: 10 }}>{error}</p>}
    </form>
  );
}

function BulkVideoForm({ onAdd }: { onAdd: (formData: FormData) => Promise<{ error: string } | { ok: true; added: number; skipped: number }> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await onAdd(new FormData(e.currentTarget));
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 24, marginTop: 16 }}>
      <label style={labelStyle}>Paste Several Links At Once</label>
      <textarea
        name="links"
        required
        rows={4}
        placeholder={"https://youtu.be/aaaaaaaaaaa\nhttps://youtube.com/watch?v=bbbbbbbbbbb\nhttps://youtube.com/shorts/ccccccccccc"}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
      />
      <p style={{ fontSize: 11, color: "var(--subtle)", marginTop: 8 }}>
        One link per line (commas or spaces work too). Each becomes a clip in the rotation, titled Clip 1, Clip 2, and so on.
      </p>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={pending} className="btn-ghost" style={{ padding: "10px 22px", marginTop: 12 }}>
        {pending ? "Adding…" : "Add All Links"}
      </button>
    </form>
  );
}

function VideoRow({ video, onDelete }: { video: FeaturedVideo; onDelete: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    const result = await deleteFeaturedVideo(video.id);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDelete();
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 14, display: "flex", gap: 16, alignItems: "center" }}>
      <div style={{ position: "relative", width: 120, height: 68, flexShrink: 0, borderRadius: 2, overflow: "hidden", background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{video.title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>youtu.be/{video.youtube_id}</div>
        {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 4 }}>{error}</p>}
      </div>
      <button
        onClick={handleDelete}
        disabled={pending}
        style={{ padding: "8px 16px", background: "transparent", border: "0.5px solid rgba(232,163,163,0.4)", color: "#e8a3a3", borderRadius: 2, cursor: "pointer", fontSize: 13, flexShrink: 0 }}
      >
        Remove
      </button>
    </div>
  );
}
