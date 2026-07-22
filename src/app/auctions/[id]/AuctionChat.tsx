"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: { username: string } | null;
};

export default function AuctionChat({
  auctionId,
  currentUserId,
  initialMessages,
}: {
  auctionId: string;
  currentUserId: string | null;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`auction-chat-${auctionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auction_messages", filter: `auction_id=eq.${auctionId}` },
        (payload: { new: Message }) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, profiles: null }]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, supabase]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSend() {
    if (!currentUserId) {
      router.push("/signin");
      return;
    }
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    setSending(true);
    const { error } = await supabase.from("auction_messages").insert({
      auction_id: auctionId,
      user_id: currentUserId,
      message: trimmed,
    });
    setSending(false);
    if (!error) setChatInput("");
  }

  return (
    <>
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No messages yet — say hello.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>{m.profiles?.username || "Bidder"}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              <div style={{ fontSize: 13, color: "var(--white)", marginTop: 2 }}>{m.message}</div>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: 12, borderTop: "0.5px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={currentUserId ? "Say something…" : "Sign in to chat"}
          disabled={!currentUserId}
          style={{ flex: 1, background: "var(--surface)", border: "none", color: "var(--white)", padding: "10px 14px", fontSize: 13, borderRadius: 2, outline: "none" }}
        />
        <button
          onClick={handleSend}
          disabled={!currentUserId || sending}
          style={{ background: "var(--gold)", color: "var(--black)", border: "none", padding: "10px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: !currentUserId ? 0.5 : 1 }}
        >
          Send
        </button>
      </div>
    </>
  );
}
