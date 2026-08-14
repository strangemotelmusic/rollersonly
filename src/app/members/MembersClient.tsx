"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useChat } from "@/lib/chat-context";
import { startDirectMessage } from "@/app/actions/chat";

type Member = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  tier: string;
  phone: string | null;
};

const tierLabel: Record<string, string> = {
  browse: "Browse",
  fancier: "Fancier",
  breeder: "Breeder",
  elite: "Elite Loft",
};

export default function MembersClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { onlineUserIds } = useChat();

  const filtered = members.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return m.username.toLowerCase().includes(q) || (m.full_name ?? "").toLowerCase().includes(q);
  });

  async function handleMessage(member: Member) {
    setError(null);
    setStartingId(member.id);
    const result = await startDirectMessage(member.id);
    setStartingId(null);
    if (!("conversationId" in result) || !result.conversationId) {
      setError(("error" in result && result.error) || "Could not start chat.");
      return;
    }
    router.push(`/chat?c=${result.conversationId}`);
  }

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px 100px" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>
          The Loft Community
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 44, fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>
          Members
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 28, maxWidth: 560 }}>
          Every breeder and fancier on RollersOnly. Click an avatar to start a conversation.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username…"
          style={{
            width: "100%",
            maxWidth: 360,
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            color: "var(--white)",
            padding: "10px 14px",
            fontSize: 13,
            borderRadius: 2,
            outline: "none",
            marginBottom: 32,
          }}
        />

        {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 20 }}>{error}</p>}

        {filtered.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>No members found.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {filtered.map((m) => {
              const name = m.full_name || m.username;
              const isOnline = onlineUserIds.has(m.id);
              const isStarting = startingId === m.id;
              return (
                <div
                  key={m.id}
                  style={{
                    background: "var(--surface)",
                    border: "0.5px solid var(--border)",
                    borderRadius: 2,
                    padding: "24px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <span style={{ position: "relative", display: "inline-block", width: 72, height: 72, marginBottom: 14 }}>
                    <span
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "var(--surface2)",
                        border: "1px solid var(--border-gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--ff-display)",
                        fontSize: 28,
                        color: "var(--gold)",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {m.avatar_url ? (
                        <Image src={m.avatar_url} alt={name} fill style={{ objectFit: "cover" }} />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </span>
                    {isOnline && (
                      <span
                        title="Online"
                        style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#2ECC71", border: "2px solid var(--surface)" }}
                      />
                    )}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--white)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>@{m.username}</span>
                  <span style={{ fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>
                    {tierLabel[m.tier] || m.tier}
                  </span>
                  <button
                    onClick={() => handleMessage(m)}
                    disabled={startingId !== null}
                    className="btn-ghost"
                    style={{
                      fontSize: 11,
                      padding: "6px 16px",
                      width: "100%",
                      cursor: startingId !== null ? "default" : "pointer",
                      opacity: startingId !== null && !isStarting ? 0.5 : 1,
                      marginBottom: m.phone ? 8 : 0,
                    }}
                  >
                    {isStarting ? "Starting…" : "Message"}
                  </button>
                  {m.phone && (
                    <a href={`tel:${m.phone}`} style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
                      📞 {m.phone}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
