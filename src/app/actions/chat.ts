"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { ensureChatMembership } from "@/lib/supabase/ensure-chat-membership";
import {
  getMyConversations,
  findOrCreateDirectConversation,
  createGroupConversation,
  getConversationMembers as getConversationMembersInternal,
} from "@/lib/chat/conversations";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." } as const;
  await ensureProfile(user);
  return { user } as const;
}

export async function refreshConversations() {
  const gate = await requireUser();
  if ("error" in gate) return { conversations: [] };

  await ensureChatMembership(gate.user.id);
  const conversations = await getMyConversations(gate.user.id);
  return { conversations };
}

export async function startDirectMessage(otherUserId: string) {
  const gate = await requireUser();
  if ("error" in gate) return gate;

  return findOrCreateDirectConversation(gate.user.id, otherUserId);
}

export async function createGroupChat(name: string, memberIds: string[]) {
  const gate = await requireUser();
  if ("error" in gate) return gate;

  const trimmed = name.trim();
  if (!trimmed) return { error: "Group name is required." } as const;

  return createGroupConversation(gate.user.id, memberIds, trimmed);
}

export async function getConversationMembers(conversationId: string) {
  const gate = await requireUser();
  if ("error" in gate) return gate;

  return getConversationMembersInternal(conversationId, gate.user.id);
}

export async function searchProfiles(query: string) {
  const gate = await requireUser();
  if ("error" in gate) return gate;

  const trimmed = query.trim();
  if (!trimmed) return { profiles: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .ilike("username", `%${trimmed}%`)
    .neq("id", gate.user.id)
    .limit(20);

  if (error) return { error: error.message } as const;
  return { profiles: data ?? [] };
}
