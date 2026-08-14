import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { ensureChatMembership } from "@/lib/supabase/ensure-chat-membership";
import { getMyConversations } from "@/lib/chat/conversations";
import { GLOBAL_ROOM_ID } from "@/lib/chat/constants";
import ChatClient from "./ChatClient";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  await ensureProfile(user);
  await ensureChatMembership(user.id);

  const requestedId = c || GLOBAL_ROOM_ID;

  let activeConversationId = GLOBAL_ROOM_ID;
  if (requestedId === GLOBAL_ROOM_ID) {
    activeConversationId = GLOBAL_ROOM_ID;
  } else {
    const { data: membership } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("conversation_id", requestedId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership) activeConversationId = requestedId;
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, sender_id, body, media_url, media_type, created_at, profiles(username, full_name, avatar_url)")
    .eq("conversation_id", activeConversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  const conversations = await getMyConversations(user.id);

  return (
    <>
      <Nav active="/chat" />
      <ChatClient
        currentUserId={user.id}
        activeConversationId={activeConversationId}
        initialMessages={messages ?? []}
        initialConversations={conversations}
      />
      <Footer />
    </>
  );
}
