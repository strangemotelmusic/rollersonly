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

type UserGate = { error: string } | { user: { id: string } };

// Explicit return-type annotation is required for `"error" in gate` to
// narrow correctly downstream — an inferred union from multiple bare
// `return` statements (no annotation) does NOT narrow the same way in this
// TypeScript version: property access after the `in` guard still carries a
// spurious `| undefined` from the other branch. Verified in isolation:
// annotated unions narrow correctly, inferred ones don't. Every function
// below that gates on requireUser() also gets an explicit return type for
// the same reason, so their callers (e.g. src/app/actions/pedigree.ts) get
// correctly-narrowing types too.
async function requireUser(): Promise<UserGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  await ensureProfile(user);
  return { user: { id: user.id } };
}

export async function refreshConversations(): Promise<{ conversations: Awaited<ReturnType<typeof getMyConversations>> }> {
  const gate = await requireUser();
  if ("error" in gate) return { conversations: [] };

  await ensureChatMembership(gate.user.id);
  const conversations = await getMyConversations(gate.user.id);
  return { conversations };
}

export async function startDirectMessage(otherUserId: string): Promise<{ error: string } | { conversationId: string }> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  return findOrCreateDirectConversation(gate.user.id, otherUserId);
}

export async function createGroupChat(
  name: string,
  memberIds: string[]
): Promise<{ error: string } | Awaited<ReturnType<typeof createGroupConversation>>> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Group name is required." };

  return createGroupConversation(gate.user.id, memberIds, trimmed);
}

export async function getConversationMembers(
  conversationId: string
): Promise<{ error: string } | Awaited<ReturnType<typeof getConversationMembersInternal>>> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  return getConversationMembersInternal(conversationId, gate.user.id);
}

export async function searchProfiles(
  query: string
): Promise<{ error: string } | { profiles: { id: string; username: string; full_name: string | null; avatar_url: string | null }[] }> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  const trimmed = query.trim();
  if (!trimmed) return { profiles: [] };

  const supabase = await createClient();
  const escaped = trimmed.replace(/[%,]/g, "");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .or(`username.ilike.%${escaped}%,full_name.ilike.%${escaped}%`)
    .neq("id", gate.user.id)
    .limit(20);

  if (error) return { error: error.message };
  return { profiles: data ?? [] };
}
