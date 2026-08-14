"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/lib/chat-context";
import { getConversationMembers } from "@/app/actions/chat";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES, GLOBAL_ROOM_ID } from "@/lib/chat/constants";
import type { ConversationSummary } from "@/lib/chat/conversations";
import NewChatModal from "./NewChatModal";

type Profile = { username: string; full_name: string | null; avatar_url: string | null };

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profiles: Profile | null;
};

export default function ChatClient({
  currentUserId,
  activeConversationId,
  initialMessages,
  initialConversations,
}: {
  currentUserId: string;
  activeConversationId: string;
  initialMessages: Message[];
  initialConversations: ConversationSummary[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const { conversations, hydrate, setActiveConversationId, markRead } = useChat();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [members, setMembers] = useState<{ user_id: string; profiles: Profile | null }[] | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileCacheRef = useRef<Map<string, Profile>>(
    new Map(initialMessages.filter((m) => m.profiles).map((m) => [m.sender_id, m.profiles as Profile]))
  );

  useEffect(() => {
    hydrate(initialConversations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveConversationId(activeConversationId);
    markRead(activeConversationId);
    setMessages(initialMessages);
    setMembers(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${activeConversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${activeConversationId}` },
        (payload: { new: Message }) => {
          const msg = payload.new;
          const cached = profileCacheRef.current.get(msg.sender_id) ?? null;

          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, profiles: cached }]));

          if (!cached && msg.sender_id !== currentUserId) {
            supabase
              .from("profiles")
              .select("username, full_name, avatar_url")
              .eq("id", msg.sender_id)
              .maybeSingle()
              .then(({ data }) => {
                if (!data) return;
                profileCacheRef.current.set(msg.sender_id, data);
                setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, profiles: data } : m)));
              });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, supabase]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  function openConversation(id: string) {
    if (id === activeConversationId) return;
    router.push(`/chat?c=${id}`);
  }

  function pickImage(files: FileList | null) {
    setUploadError(null);
    const file = files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPEG, PNG, WebP, or GIF images are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Images must be under 5MB.");
      return;
    }
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingImage(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
  }

  function clearPendingImage() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingImage(null);
    setPendingPreviewUrl(null);
  }

  async function handleSend() {
    if (!currentUserId) {
      router.push("/signin");
      return;
    }
    const trimmed = chatInput.trim();
    if (!trimmed && !pendingImage) return;

    setSending(true);
    setUploadError(null);

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (pendingImage) {
      const path = `${currentUserId}/${crypto.randomUUID()}-${pendingImage.name}`;
      const { error: uploadErr } = await supabase.storage.from("chat-media").upload(path, pendingImage);
      if (uploadErr) {
        setUploadError(`Upload failed: ${uploadErr.message}`);
        setSending(false);
        return;
      }
      mediaUrl = supabase.storage.from("chat-media").getPublicUrl(path).data.publicUrl;
      mediaType = "image";
    }

    const { data: inserted, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: activeConversationId,
        sender_id: currentUserId,
        body: trimmed || null,
        media_url: mediaUrl,
        media_type: mediaType,
      })
      .select("id, conversation_id, sender_id, body, media_url, media_type, created_at, profiles(username, full_name, avatar_url)")
      .single();

    setSending(false);

    if (error || !inserted) {
      setUploadError(error?.message || "Could not send message.");
      return;
    }

    const senderProfile = (inserted.profiles as unknown as Profile) ?? null;
    if (senderProfile) profileCacheRef.current.set(currentUserId, senderProfile);

    setMessages((prev) => (prev.some((m) => m.id === inserted.id) ? prev : [...prev, { ...inserted, profiles: senderProfile }]));
    setChatInput("");
    clearPendingImage();
  }

  async function loadMembers() {
    if (members) {
      setMembers(null);
      return;
    }
    const result = await getConversationMembers(activeConversationId);
    if ("members" in result) setMembers(result.members as { user_id: string; profiles: Profile | null }[]);
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isGroup = activeConversation?.type === "group";

  return (
    <div style={{ display: "flex", paddingTop: 72, minHeight: "100vh", background: "var(--black)" }}>
      {/* SIDEBAR */}
      <div style={{ width: 300, flexShrink: 0, borderRight: "0.5px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20, borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 400, color: "var(--white)" }}>Chat</h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            style={{ background: "var(--gold)", color: "var(--black)", border: "none", padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 2 }}
          >
            + New
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: "var(--muted)" }}>Loading…</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 20px",
                  background: c.id === activeConversationId ? "var(--surface)" : "transparent",
                  border: "none",
                  borderBottom: "0.5px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.title}
                  </span>
                  {c.unreadCount > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        color: "var(--black)",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                        flexShrink: 0,
                      }}
                    >
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.preview}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN PANE */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 24px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)" }}>
            {activeConversation?.title || (activeConversationId === GLOBAL_ROOM_ID ? "Global Chat" : "Chat")}
          </h2>
          {isGroup && (
            <button onClick={loadMembers} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer" }}>
              {members ? "Hide members" : "View members"}
            </button>
          )}
        </div>

        {members && (
          <div style={{ padding: "10px 24px", borderBottom: "0.5px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {members.map((m) => (
              <span key={m.user_id} style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface)", padding: "4px 10px", borderRadius: 2 }}>
                {m.profiles?.full_name || m.profiles?.username || "Member"}
              </span>
            ))}
          </div>
        )}

        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>No messages yet — say hello.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id}>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.sender_id === currentUserId ? "var(--gold-light)" : "var(--gold)" }}>
                  {m.profiles?.full_name || m.profiles?.username || "Member"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
                {m.body && <div style={{ fontSize: 13, color: "var(--white)", marginTop: 2 }}>{m.body}</div>}
                {m.media_url && m.media_type === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.media_url}
                    alt="Shared photo"
                    style={{ marginTop: 6, maxWidth: 280, maxHeight: 280, borderRadius: 4, display: "block", border: "0.5px solid var(--border)" }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 16, borderTop: "0.5px solid var(--border)" }}>
          {uploadError && <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 8 }}>{uploadError}</div>}
          {pendingPreviewUrl && (
            <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingPreviewUrl} alt="Attachment preview" style={{ height: 64, borderRadius: 4, border: "0.5px solid var(--border)" }} />
              <button
                onClick={clearPendingImage}
                style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--black)", color: "var(--white)", border: "0.5px solid var(--border)", fontSize: 10, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={(e) => {
                pickImage(e.target.files);
                e.target.value = "";
              }}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach a photo"
              style={{ background: "var(--surface)", border: "none", color: "var(--white)", padding: "0 14px", fontSize: 16, cursor: "pointer", borderRadius: 2 }}
            >
              📷
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Say something…"
              style={{ flex: 1, background: "var(--surface)", border: "none", color: "var(--white)", padding: "10px 14px", fontSize: 13, borderRadius: 2, outline: "none" }}
            />
            <button
              onClick={handleSend}
              disabled={sending}
              style={{ background: "var(--gold)", color: "var(--black)", border: "none", padding: "10px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: sending ? 0.5 : 1 }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onStarted={(conversationId) => {
            setShowNewChatModal(false);
            router.push(`/chat?c=${conversationId}`);
          }}
        />
      )}
    </div>
  );
}
