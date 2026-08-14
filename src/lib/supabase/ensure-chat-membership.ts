import { createAdminClient } from "./admin";
import { GLOBAL_ROOM_ID } from "@/lib/chat/constants";

// Everyone is implicitly allowed to read/post in the global room (RLS checks
// type = 'global', not participant rows), but we still want a
// chat_participants row per user so last_read_at / unread counts work. Lazy
// upsert on first /chat visit, same "create on first touch" shape as
// ensure-profile.ts, rather than backfilling every existing user or wiring
// up a DB trigger (no migration/trigger infra in this repo).
export async function ensureChatMembership(userId: string) {
  const admin = createAdminClient();

  await admin
    .from("chat_participants")
    .upsert(
      { conversation_id: GLOBAL_ROOM_ID, user_id: userId },
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
    );
}
