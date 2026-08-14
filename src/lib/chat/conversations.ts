import { createAdminClient } from "@/lib/supabase/admin";
import { GLOBAL_ROOM_ID } from "./constants";

export type ConversationSummary = {
  id: string;
  type: string;
  title: string;
  avatarUrl: string | null;
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
};

// chat_participants SELECT is own-row-only (avoids a self-referential RLS
// policy), so "who else is in this conversation" can never be resolved from
// the browser client — everything conversation-membership-shaped goes
// through the admin client behind a manual auth check instead, same
// reasoning bids.ts uses the admin client for invariants RLS can't express.

export async function getMyConversations(userId: string): Promise<ConversationSummary[]> {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("chat_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  const membership = new Map((rows ?? []).map((r) => [r.conversation_id, r.last_read_at]));
  if (!membership.has(GLOBAL_ROOM_ID)) membership.set(GLOBAL_ROOM_ID, new Date(0).toISOString());

  const conversationIds = Array.from(membership.keys());
  if (conversationIds.length === 0) return [];

  const { data: conversations } = await admin
    .from("chat_conversations")
    .select("id, type, name, last_message_at")
    .in("id", conversationIds);

  const summaries = await Promise.all(
    (conversations ?? []).map(async (c) => {
      const lastReadAt = membership.get(c.id) ?? new Date(0).toISOString();

      const [{ count }, { data: lastMessage }, { title, avatarUrl }] = await Promise.all([
        admin
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .gt("created_at", lastReadAt)
          .neq("sender_id", userId),
        admin
          .from("chat_messages")
          .select("body, media_type, sender_id, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        resolveTitleAndAvatar(admin, c, userId),
      ]);

      return {
        id: c.id,
        type: c.type,
        title,
        avatarUrl,
        preview: lastMessage ? previewText(lastMessage) : "No messages yet",
        lastMessageAt: lastMessage?.created_at ?? c.last_message_at,
        unreadCount: count ?? 0,
      };
    })
  );

  return summaries.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
}

function previewText(message: { body: string | null; media_type: string | null }) {
  if (message.body) return message.body;
  if (message.media_type === "image") return "📷 Photo";
  if (message.media_type === "video") return "🎥 Video";
  return "";
}

async function resolveTitleAndAvatar(
  admin: ReturnType<typeof createAdminClient>,
  conversation: { id: string; type: string; name: string | null },
  userId: string
) {
  if (conversation.type === "global") return { title: "Global Chat", avatarUrl: null };
  if (conversation.type === "group") return { title: conversation.name || "Group Chat", avatarUrl: null };

  const { data: other } = await admin
    .from("chat_participants")
    .select("profiles(username, full_name, avatar_url)")
    .eq("conversation_id", conversation.id)
    .neq("user_id", userId)
    .maybeSingle();

  const profile = other?.profiles as { username: string; full_name: string | null; avatar_url: string | null } | null;
  return {
    title: profile?.full_name || profile?.username || "Direct Message",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function getConversationMembers(conversationId: string, requestingUserId: string) {
  const admin = createAdminClient();

  const authorized = await isParticipant(admin, conversationId, requestingUserId);
  if (!authorized) return { error: "Not a participant of this conversation." } as const;

  const { data } = await admin
    .from("chat_participants")
    .select("user_id, profiles(username, full_name, avatar_url)")
    .eq("conversation_id", conversationId);

  return { members: data ?? [] } as const;
}

async function isParticipant(admin: ReturnType<typeof createAdminClient>, conversationId: string, userId: string) {
  if (conversationId === GLOBAL_ROOM_ID) return true;
  const { data } = await admin
    .from("chat_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function findOrCreateDirectConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) return { error: "You can't start a chat with yourself." } as const;

  const admin = createAdminClient();

  const { data: myRows } = await admin.from("chat_participants").select("conversation_id").eq("user_id", userId);
  const myConversationIds = (myRows ?? []).map((r) => r.conversation_id);

  if (myConversationIds.length > 0) {
    const { data: myDms } = await admin
      .from("chat_conversations")
      .select("id")
      .eq("type", "dm")
      .in("id", myConversationIds);
    const myDmIds = (myDms ?? []).map((c) => c.id);

    if (myDmIds.length > 0) {
      const { data: theirDms } = await admin
        .from("chat_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myDmIds);

      const existing = theirDms?.[0]?.conversation_id;
      if (existing) return { conversationId: existing } as const;
    }
  }

  const { data: conversation, error } = await admin
    .from("chat_conversations")
    .insert({ type: "dm", created_by: userId })
    .select("id")
    .single();

  if (error || !conversation) return { error: error?.message || "Could not start conversation." } as const;

  await admin.from("chat_participants").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);

  return { conversationId: conversation.id } as const;
}

export async function createGroupConversation(userId: string, memberIds: string[], name: string) {
  const admin = createAdminClient();

  const uniqueMembers = Array.from(new Set([userId, ...memberIds]));
  if (uniqueMembers.length < 3) {
    return { error: "Pick at least 2 other people for a group." } as const;
  }

  const { data: conversation, error } = await admin
    .from("chat_conversations")
    .insert({ type: "group", name, created_by: userId })
    .select("id")
    .single();

  if (error || !conversation) return { error: error?.message || "Could not create group." } as const;

  await admin
    .from("chat_participants")
    .insert(uniqueMembers.map((id) => ({ conversation_id: conversation.id, user_id: id })));

  return { conversationId: conversation.id } as const;
}
