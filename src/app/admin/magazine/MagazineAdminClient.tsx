"use client";

import { useState } from "react";
import Image from "next/image";
import { createMagazineIssue, updateMagazineIssue, deleteMagazineIssue } from "@/app/actions/magazine-admin";

type Issue = {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  content: string | null;
  cover_image_url: string | null;
  published_at: string;
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

export default function MagazineAdminClient({ initialIssues }: { initialIssues: Issue[] }) {
  const [issues, setIssues] = useState(initialIssues);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <button
        className="btn-gold"
        style={{ padding: "10px 22px", marginBottom: 24 }}
        onClick={() => setShowAddForm((s) => !s)}
      >
        {showAddForm ? "Cancel" : "+ Add New Issue"}
      </button>

      {showAddForm && (
        <IssueForm
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (formData) => {
            const result = await createMagazineIssue(formData);
            if (result.error) return result;
            window.location.reload();
            return result;
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {issues.length === 0 && !showAddForm && <p style={{ fontSize: 14, color: "var(--muted)" }}>No issues published yet.</p>}
        {issues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} onDelete={() => setIssues((prev) => prev.filter((i) => i.id !== issue.id))} />
        ))}
      </div>
    </div>
  );
}

function IssueRow({ issue, onDelete }: { issue: Issue; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${issue.title}"? This can't be undone.`)) return;
    setPending(true);
    const result = await deleteMagazineIssue(issue.id);
    setPending(false);
    if (result.error) {
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
          const result = await updateMagazineIssue(issue.id, formData);
          if (result.error) return result;
          window.location.reload();
          return result;
        }}
      />
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ position: "relative", width: 70, height: 100, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
        {issue.cover_image_url && <Image src={issue.cover_image_url} alt={issue.title} fill style={{ objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          Issue #{issue.issue_number}
        </div>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 4 }}>{issue.title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {new Date(issue.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
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

function IssueForm({
  issue,
  onCancel,
  onSubmit,
}: {
  issue?: Issue;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    setPending(false);
    if (result.error) setError(result.error);
  }

  const publishedDefault = issue ? new Date(issue.published_at).toISOString().slice(0, 10) : "";

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Issue Title</label>
          <input name="title" defaultValue={issue?.title} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Issue Number</label>
          <input name="issueNumber" type="number" min="1" step="1" defaultValue={issue?.issue_number} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Published Date</label>
          <input name="publishedAt" type="date" defaultValue={publishedDefault} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Description</label>
        <textarea name="description" defaultValue={issue?.description ?? ""} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Full Issue Content</label>
        <textarea name="content" defaultValue={issue?.content ?? ""} rows={12} style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--ff-body)", lineHeight: 1.6 }} />
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          The first ~600 characters show as a free sample to non-subscribers; the rest is visible to Breeder and
          Elite Loft members only.
        </p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{issue ? "Replace Cover Image (optional)" : "Cover Image"}</label>
        <input name="file" type="file" accept="image/*" style={{ fontSize: 13, color: "var(--muted)" }} />
      </div>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending} className="btn-gold" style={{ padding: "10px 24px" }}>
          {pending ? "Saving…" : issue ? "Save Changes" : "Add Issue"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
