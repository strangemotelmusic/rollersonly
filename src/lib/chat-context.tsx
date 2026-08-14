"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { refreshConversations as refreshConversationsAction } from "@/app/actions/chat";
import type { ConversationSummary } from "@/lib/chat/conversations";

type NewMessagePayload = {
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_type: string | null;
  created_at: string;
};

type ChatContextValue = {
  conversations: ConversationSummary[];
  unreadTotal: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  markRead: (conversationId: string) => void;
  refresh: () => Promise<void>;
  hydrate: (initial: ConversationSummary[]) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  async function refresh() {
    const result = await refreshConversationsAction();
    setConversations(result.conversations);
  }

  // One-time bootstrap: who's signed in, and their conversation list. If
  // nobody's signed in, conversations just stays empty and the realtime
  // effect below never subscribes — no chat activity for anonymous visitors.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);
      if (user) await refresh();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One realtime channel for the whole session, not one per conversation.
  // The chat_messages listener is intentionally unfiltered — Supabase
  // Realtime enforces the table's SELECT RLS per subscriber, so each browser
  // only ever receives INSERTs it's actually authorized to read (verified in
  // local testing before this shipped, see plan notes).
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("chat-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload: { new: NewMessagePayload }) => {
          const msg = payload.new;
          const isMine = msg.sender_id === userIdRef.current;
          const isOpen = msg.conversation_id === activeRef.current;

          setConversations((prev) => {
            if (!prev.some((c) => c.id === msg.conversation_id)) return prev;
            const next = prev.map((c) =>
              c.id === msg.conversation_id
                ? {
                    ...c,
                    preview: previewFor(msg),
                    lastMessageAt: msg.created_at,
                    unreadCount: isMine || isOpen ? c.unreadCount : c.unreadCount + 1,
                  }
                : c
            );
            return next.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_participants", filter: `user_id=eq.${userId}` },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function markRead(conversationId: string) {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
    if (!userIdRef.current) return;
    supabase
      .from("chat_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userIdRef.current)
      .then(() => {});
  }

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Lets a page that already SSR'd a conversation list (e.g. /chat) seed the
  // shared context immediately instead of waiting on the client-side
  // refresh() this provider kicks off on mount — only fills in if nothing's
  // loaded yet, so it never clobbers a fresher client-side state.
  function hydrate(initial: ConversationSummary[]) {
    setConversations((prev) => (prev.length > 0 ? prev : initial));
  }

  return (
    <ChatContext.Provider
      value={{ conversations, unreadTotal, activeConversationId, setActiveConversationId, markRead, refresh, hydrate }}
    >
      {children}
    </ChatContext.Provider>
  );
}

function previewFor(msg: NewMessagePayload) {
  if (msg.body) return msg.body;
  if (msg.media_type === "image") return "📷 Photo";
  if (msg.media_type === "video") return "🎥 Video";
  return "";
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
