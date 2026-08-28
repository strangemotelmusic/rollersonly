"use client";

import { useState } from "react";
import Image from "next/image";
import { createMagazineIssue, updateMagazineIssue, deleteMagazineIssue } from "@/app/actions/magazine-admin";
import { createClient } from "@/lib/supabase/client";

type Issue = {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  content: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
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
            if ("error" in result) return result;
            window.location.reload();
            return {};
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
          const result = await updateMagazineIssue(issue.id, formData);
          if ("error" in result) return result;
          window.location.reload();
          return {};
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
          {issue.pdf_url ? (
            <span style={{ marginLeft: 10, color: "#2DD4BF" }}>● PDF uploaded</span>
          ) : (
            <span style={{ marginLeft: 10, color: "#5B6675" }}>No PDF — text only</span>
          )}
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(issue?.pdf_url ?? null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    setUploadingPdf(true);
    // Uploaded straight from the browser to Storage, bypassing the server
    // action entirely - a full magazine issue PDF can easily run 10-50MB+,
    // well past what a Next.js server action body can take. Storage's
    // standard upload method supports up to 5GB; the earlier "exceeded
    // maximum allowed size" failures were the bucket's/project's configured
    // size limits, now raised, not a technical ceiling on this method.
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    console.log("[pdf-upload-debug] user id:", session?.user?.id, "role:", session?.user?.role, "has token:", !!session?.access_token, "expires at:", session?.expires_at, "now:", Math.floor(Date.now() / 1000));
    const path = `${crypto.randomUUID()}.pdf`;
    const { error: uploadErr } = await supabase.storage.from("magazine-pdfs").upload(path, file, { contentType: "application/pdf", upsert: true });
    setUploadingPdf(false);
    if (uploadErr) {
      setError(`PDF upload failed: ${uploadErr.message}`);
      return;
    }
    const url = supabase.storage.from("magazine-pdfs").getPublicUrl(path).data.publicUrl;
    setPdfUrl(url);
    setPdfFileName(file.name);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (pdfUrl) formData.set("pdfUrl", pdfUrl);
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

      <div style={{ marginBottom: 20, padding: 16, background: "var(--void)", border: "0.5px solid var(--border-gold)", borderRadius: 2 }}>
        <label style={labelStyle}>Upload Issue PDF</label>
        <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={uploadingPdf} style={{ fontSize: 13, color: "var(--muted)" }} />
        {uploadingPdf && <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 8 }}>Uploading… this can take a few minutes for large files.</p>}
        {!uploadingPdf && pdfUrl && (
          <p style={{ fontSize: 12, color: "#2DD4BF", marginTop: 8 }}>
            ✓ {pdfFileName || "PDF on file"} — readers will get the flipbook viewer.
          </p>
        )}
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
          Members with access read this as a page-turning flipbook. Leave blank to fall back to the plain-text
          reader below.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Full Issue Content (optional)</label>
        <textarea name="content" defaultValue={issue?.content ?? ""} rows={8} style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--ff-body)", lineHeight: 1.6 }} />
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          Used for the free sample shown to non-subscribers (first ~600 characters), and as the full reader when no
          PDF is uploaded.
        </p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{issue ? "Replace Cover Image (optional)" : "Cover Image"}</label>
        <input name="file" type="file" accept="image/*" style={{ fontSize: 13, color: "var(--muted)" }} />
      </div>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending || uploadingPdf} className="btn-gold" style={{ padding: "10px 24px" }}>
          {pending ? "Saving…" : issue ? "Save Changes" : "Add Issue"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
