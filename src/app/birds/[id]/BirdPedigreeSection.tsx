"use client";

import { useState } from "react";
import Link from "next/link";
import PedigreeTree from "@/components/pedigree/PedigreeTree";
import { renderPedigreePdf } from "@/lib/pedigree/pdf";
import { birdLabel, type PedigreeNode } from "@/lib/pedigree/tree";
import { createClient } from "@/lib/supabase/client";
import { emailPedigreePdf, sendPedigreeToSubscriber } from "@/app/actions/pedigree";
import { searchProfiles } from "@/app/actions/chat";

const buttonStyle: React.CSSProperties = {
  padding: "9px 16px",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderRadius: 2,
  cursor: "pointer",
  background: "transparent",
  border: "0.5px solid var(--border-gold)",
  color: "var(--gold)",
};

export default function BirdPedigreeSection({ root, loftName }: { root: PedigreeNode; loftName: string | null }) {
  const supabase = createClient();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState<"none" | "email" | "subscriber">("none");
  const [status, setStatus] = useState<string | null>(null);

  function handleDownload() {
    const blob = renderPedigreePdf(root, loftName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${birdLabel(root).replace(/[^a-z0-9]+/gi, "-")}-pedigree.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function ensureShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    setUploading(true);
    setStatus(null);
    try {
      const blob = renderPedigreePdf(root, loftName);
      const path = `${root.id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadErr } = await supabase.storage.from("pedigree-exports").upload(path, blob, { contentType: "application/pdf" });
      if (uploadErr) {
        setStatus(`Could not prepare share link: ${uploadErr.message}`);
        return null;
      }
      const url = supabase.storage.from("pedigree-exports").getPublicUrl(path).data.publicUrl;
      setShareUrl(url);
      return url;
    } finally {
      setUploading(false);
    }
  }

  async function openSharePanel(target: "email" | "subscriber") {
    setStatus(null);
    const url = await ensureShareUrl();
    if (!url) return;
    setPanel(target);
  }

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>Bloodline</div>
        <Link href="/pedigree" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>Full pedigree vault →</Link>
      </div>

      <PedigreeTree root={root} />

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button type="button" onClick={handleDownload} style={buttonStyle}>Download PDF</button>
        <button type="button" onClick={() => openSharePanel("email")} disabled={uploading} style={{ ...buttonStyle, opacity: uploading ? 0.6 : 1 }}>
          {uploading && panel !== "subscriber" ? "Preparing…" : "Email Pedigree"}
        </button>
        <button type="button" onClick={() => openSharePanel("subscriber")} disabled={uploading} style={{ ...buttonStyle, opacity: uploading ? 0.6 : 1 }}>
          {uploading && panel === "subscriber" ? "Preparing…" : "Send to a Subscriber"}
        </button>
      </div>

      {status && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>{status}</p>}

      {panel === "email" && shareUrl && (
        <EmailPanel
          birdName={birdLabel(root)}
          shareUrl={shareUrl}
          onClose={() => setPanel("none")}
          onStatus={setStatus}
        />
      )}

      {panel === "subscriber" && shareUrl && (
        <SubscriberPanel
          birdName={birdLabel(root)}
          shareUrl={shareUrl}
          onClose={() => setPanel("none")}
          onStatus={setStatus}
        />
      )}
    </div>
  );
}

function panelStyle(): React.CSSProperties {
  return { marginTop: 14, background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 16, maxWidth: 420 };
}

function EmailPanel({ birdName, shareUrl, onClose, onStatus }: { birdName: string; shareUrl: string; onClose: () => void; onStatus: (s: string | null) => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setSending(true);
    onStatus(null);
    const result = await emailPedigreePdf(email.trim(), birdName, shareUrl);
    setSending(false);
    if ("error" in result) {
      const subject = encodeURIComponent(`Pedigree — ${birdName}`);
      const body = encodeURIComponent(`Here's the pedigree for ${birdName} on RollersOnly:\n\n${shareUrl}`);
      window.location.href = `mailto:${email.trim()}?subject=${subject}&body=${body}`;
      onStatus("Direct send isn't set up yet — opening your email app with the pedigree link ready to send.");
    } else {
      onStatus(`Sent to ${email.trim()}.`);
    }
    onClose();
  }

  return (
    <div style={panelStyle()}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Email this pedigree</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          style={{ flex: 1, background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "9px 12px", fontSize: 13, borderRadius: 2, outline: "none" }}
        />
        <button type="button" onClick={send} disabled={sending || !email.trim()} className="btn-gold" style={{ padding: "9px 16px" }}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

function SubscriberPanel({ birdName, shareUrl, onClose, onStatus }: { birdName: string; shareUrl: string; onClose: () => void; onStatus: (s: string | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string | null; full_name: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  async function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const result = await searchProfiles(q);
    setSearching(false);
    if ("profiles" in result) setResults(result.profiles);
  }

  async function send(otherUserId: string) {
    setSendingTo(otherUserId);
    const result = await sendPedigreeToSubscriber(otherUserId, birdName, shareUrl);
    setSendingTo(null);
    onStatus("error" in result ? result.error : "Sent via chat.");
    onClose();
  }

  return (
    <div style={panelStyle()}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Send to a subscriber</div>
      <input
        value={query}
        onChange={(e) => runSearch(e.target.value)}
        placeholder="Search by username…"
        style={{ width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "9px 12px", fontSize: 13, borderRadius: 2, outline: "none", marginBottom: 8 }}
      />
      {searching && <div style={{ fontSize: 12, color: "var(--muted)" }}>Searching…</div>}
      {results.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => send(p.id)}
          disabled={sendingTo === p.id}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 4px", background: "none", border: "none", borderBottom: "0.5px solid var(--border)", color: "var(--white)", fontSize: 13, cursor: "pointer" }}
        >
          {sendingTo === p.id ? "Sending…" : p.full_name || p.username || "Member"}
        </button>
      ))}
    </div>
  );
}
