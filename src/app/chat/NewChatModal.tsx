"use client";

import { useEffect, useState } from "react";
import { searchProfiles, startDirectMessage, createGroupChat } from "@/app/actions/chat";

type ProfileResult = { id: string; username: string; full_name: string | null; avatar_url: string | null };

export default function NewChatModal({
  onClose,
  onStarted,
}: {
  onClose: () => void;
  onStarted: (conversationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [selected, setSelected] = useState<Map<string, ProfileResult>>(new Map());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await searchProfiles(trimmed);
      if ("profiles" in result && result.profiles) setResults(result.profiles);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function toggle(profile: ProfileResult) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(profile.id)) next.delete(profile.id);
      else next.set(profile.id, profile);
      return next;
    });
  }

  const needsGroupName = selected.size >= 2;

  async function handleSubmit() {
    setError(null);
    if (selected.size === 0) {
      setError("Pick at least one person.");
      return;
    }
    if (needsGroupName && !groupName.trim()) {
      setError("Give the group a name.");
      return;
    }

    setLoading(true);
    const result =
      selected.size === 1 && !groupName.trim()
        ? await startDirectMessage(Array.from(selected.keys())[0])
        : await createGroupChat(groupName, Array.from(selected.keys()));
    setLoading(false);

    if (!("conversationId" in result) || !result.conversationId) {
      setError(("error" in result && result.error) || "Could not start chat.");
      return;
    }
    onStarted(result.conversationId);
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, maxHeight: "80vh", display: "flex", flexDirection: "column", background: "var(--deep)", border: "0.5px solid var(--border-gold)", borderRadius: 4 }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 400, color: "var(--white)" }}>New Chat</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username…"
            style={{ width: "100%", background: "var(--surface)", border: "none", color: "var(--white)", padding: "10px 14px", fontSize: 13, borderRadius: 2, outline: "none", boxSizing: "border-box" }}
          />

          {selected.size > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Array.from(selected.values()).map((p) => (
                <span
                  key={p.id}
                  onClick={() => toggle(p)}
                  style={{ fontSize: 12, color: "var(--gold)", background: "var(--gold-dim)", padding: "4px 10px", borderRadius: 2, cursor: "pointer" }}
                >
                  {p.full_name || p.username} ✕
                </span>
              ))}
            </div>
          )}

          {needsGroupName && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              style={{ width: "100%", marginTop: 12, background: "var(--surface)", border: "none", color: "var(--white)", padding: "10px 14px", fontSize: 13, borderRadius: 2, outline: "none", boxSizing: "border-box" }}
            />
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {results.map((p) => (
            <label
              key={p.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderBottom: "0.5px solid var(--border)" }}
            >
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p)} style={{ accentColor: "var(--gold)" }} />
              <span style={{ fontSize: 13, color: "var(--white)" }}>{p.full_name || p.username}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>@{p.username}</span>
            </label>
          ))}
          {query.trim() && results.length === 0 && (
            <div style={{ padding: "12px 0", fontSize: 12, color: "var(--muted)" }}>No members found.</div>
          )}
        </div>

        <div style={{ padding: 20, borderTop: "0.5px solid var(--border)" }}>
          {error && <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10 }}>{error}</div>}
          <button
            onClick={handleSubmit}
            disabled={loading || selected.size === 0}
            style={{ width: "100%", background: "var(--gold)", color: "var(--black)", border: "none", padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: loading || selected.size === 0 ? 0.5 : 1 }}
          >
            {loading ? "Starting…" : needsGroupName ? "Create Group" : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
