"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { needsTranscode, transcodeToMp4 } from "@/lib/chat/transcode";
import { submitVideoForReview } from "@/app/actions/video-submissions";
import { MAX_SUBMISSION_VIDEO_SECONDS, MAX_SUBMISSION_VIDEO_BYTES, MAX_SUBMISSION_INPUT_BYTES } from "@/lib/future-issues/submission-constants";

type Submission = {
  id: string;
  title: string;
  status: string;
  rejection_note: string | null;
  created_at: string;
};

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(212,175,55,0.12)", color: "var(--gold)", label: "Pending Review" },
  approved: { bg: "rgba(50,200,100,0.1)", color: "#50c878", label: "● Live on the Channel" },
  rejected: { bg: "rgba(231,76,60,0.1)", color: "#e74c3c", label: "Not Approved" },
};

export default function SubmitVideoClient({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickFile(files: FileList | null) {
    setError(null);
    setDone(false);
    const picked = files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    if (picked.size > MAX_SUBMISSION_INPUT_BYTES) {
      setError(`That file is too large — please keep it under ${MAX_SUBMISSION_INPUT_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setFile(picked);
  }

  async function handleSubmit() {
    if (!file) {
      setError("Choose a video first.");
      return;
    }
    if (!title.trim()) {
      setError("Give your video a title.");
      return;
    }
    setError(null);

    let uploadFile = file;
    if (needsTranscode(file)) {
      setConverting(true);
      setProgress(0);
      try {
        uploadFile = await transcodeToMp4(file, MAX_SUBMISSION_VIDEO_SECONDS, setProgress);
      } catch {
        setConverting(false);
        setError("Could not convert this video — try a different file.");
        return;
      }
      setConverting(false);
    }

    if (uploadFile.size > MAX_SUBMISSION_VIDEO_BYTES) {
      setError(`Your video is too large after conversion — please submit something under ${MAX_SUBMISSION_VIDEO_BYTES / 1024 / 1024}MB or trim it down.`);
      return;
    }

    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      setError("You must be signed in.");
      return;
    }

    const path = `${user.id}/${crypto.randomUUID()}-${uploadFile.name}`;
    const { error: uploadErr } = await supabase.storage.from("channel-submissions").upload(path, uploadFile);
    if (uploadErr) {
      setUploading(false);
      setError(`Upload failed: ${uploadErr.message}`);
      return;
    }
    const videoUrl = supabase.storage.from("channel-submissions").getPublicUrl(path).data.publicUrl;

    const result = await submitVideoForReview(title, videoUrl);
    setUploading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setSubmissions((prev) => [{ id: crypto.randomUUID(), title: title.trim(), status: "pending", rejection_note: null, created_at: new Date().toISOString() }, ...prev]);
    setTitle("");
    setFile(null);
    setDone(true);
  }

  const busy = converting || uploading;

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      <div style={{ background: "var(--void)", padding: "72px 64px 48px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
          The RollersOnly Channel
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(32px,5vw,52px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 640 }}>
          Submit a <em style={{ color: "var(--gold)" }}>Video</em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 560 }}>
          Share your best kit flights, breaks, and loft footage. Every submission is reviewed before it plays on{" "}
          <Link href="/future-issues" style={{ color: "var(--gold)" }}>the big screen</Link>.
        </p>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 32px" }}>
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 3, padding: 28 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Video Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blue Bar Kit — Sunset Break"
            disabled={busy}
            style={{ width: "100%", background: "var(--void)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 14px", fontSize: 14, borderRadius: 2, outline: "none", marginBottom: 20 }}
          />

          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Video File
          </label>
          <input
            type="file"
            accept="video/*"
            disabled={busy}
            onChange={(e) => {
              pickFile(e.target.files);
              e.target.value = "";
            }}
            style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}
          />
          {file && !busy && <p style={{ fontSize: 12, color: "var(--gold)", marginBottom: 12 }}>Selected: {file.name}</p>}
          <p style={{ fontSize: 11, color: "var(--subtle)", marginBottom: 20 }}>
            Any common video format works — up to {MAX_SUBMISSION_VIDEO_SECONDS / 60} minutes long.
          </p>

          {converting && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--gold)", marginBottom: 6 }}>Preparing your video… {Math.round(progress * 100)}%</div>
              <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "var(--gold)", transition: "width 0.2s ease" }} />
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
          {done && <p style={{ fontSize: 13, color: "#50c878", marginBottom: 16 }}>Submitted — thanks! We&apos;ll review it shortly.</p>}

          <button onClick={handleSubmit} disabled={busy} className="btn-gold-lg" style={{ width: "100%", textAlign: "center", opacity: busy ? 0.6 : 1 }}>
            {converting ? "Preparing…" : uploading ? "Submitting…" : "Submit for Review"}
          </button>
        </div>

        {submissions.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>Your Submissions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
              {submissions.map((s) => {
                const st = statusStyle[s.status] ?? statusStyle.pending;
                return (
                  <div key={s.id} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, color: "var(--white)" }}>{s.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 2, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                        {st.label}
                      </span>
                    </div>
                    {s.status === "rejected" && s.rejection_note && (
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Note: {s.rejection_note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
