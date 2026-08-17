"use client";

import { useState } from "react";
import { sendBulkEmail, type CampaignHistoryRow } from "@/app/actions/email-campaigns";

type Counts = { members: number; newsletter: number };

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "0.5px solid var(--border)",
  color: "var(--white)",
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 2,
  outline: "none",
};

export default function SubscribersAdminClient({
  initialCounts,
  initialHistory,
}: {
  initialCounts: Counts;
  initialHistory: CampaignHistoryRow[];
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [confirming, setConfirming] = useState(false);

  const total = initialCounts.members + initialCounts.newsletter;

  async function handleSend() {
    setSending(true);
    setError("");
    setResult(null);
    const bodyHtml = body
      .split("\n\n")
      .map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    const res = await sendBulkEmail(subject, bodyHtml);
    setSending(false);
    setConfirming(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult(`Sent to ${res.sent} recipients.`);
    setHistory((prev) => [{ id: crypto.randomUUID(), subject, recipientCount: res.sent, sentAt: new Date().toISOString() }, ...prev]);
    setSubject("");
    setBody("");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
            Opted-in Members
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "var(--ff-display)", color: "var(--white)" }}>{initialCounts.members}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
            Newsletter Signups
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "var(--ff-display)", color: "var(--white)" }}>{initialCounts.newsletter}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
            Total Reach
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "var(--ff-display)", color: "var(--gold)" }}>{total}</div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 16, color: "var(--white)", marginBottom: 18 }}>Compose a campaign</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Subject
          </label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} placeholder="e.g. New auctions live this week" />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder={"Write your message here. Leave a blank line between paragraphs."}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 14 }}>{error}</p>}
        {result && <p style={{ fontSize: 13, color: "var(--gold)", marginBottom: 14 }}>{result}</p>}

        {!confirming ? (
          <button
            className="btn-gold"
            style={{ padding: "10px 22px" }}
            disabled={sending || !subject.trim() || !body.trim()}
            onClick={() => setConfirming(true)}
          >
            Review &amp; Send
          </button>
        ) : (
          <div style={{ border: "0.5px solid var(--border)", borderRadius: 2, padding: 16 }}>
            <p style={{ fontSize: 13, color: "var(--white)", marginBottom: 14 }}>
              This will send to <strong>{total}</strong> real people ({initialCounts.members} members, {initialCounts.newsletter}{" "}
              newsletter). This can&apos;t be undone. Send now?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-gold" style={{ padding: "8px 18px" }} disabled={sending} onClick={handleSend}>
                {sending ? "Sending…" : "Yes, send it"}
              </button>
              <button
                style={{ padding: "8px 18px", background: "transparent", border: "0.5px solid var(--border)", color: "var(--muted)", borderRadius: 2, cursor: "pointer" }}
                disabled={sending}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 16, color: "var(--white)", marginBottom: 14 }}>Past campaigns</div>
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>No campaigns sent yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "var(--surface)",
                  border: "0.5px solid var(--border)",
                  borderRadius: 2,
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--white)" }}>{c.subject}</span>
                <span style={{ color: "var(--muted)" }}>
                  {c.recipientCount} sent · {new Date(c.sentAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
