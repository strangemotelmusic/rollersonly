import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Fired by a Supabase Database Webhook (a plain Postgres trigger using the
// built-in supabase_functions.http_request() helper - see supabase/schema.sql
// for the exact trigger SQL) on every chat_messages INSERT. Looks up every
// other participant in that conversation, finds their registered device
// tokens, and pushes a notification via Expo's Push API. This is the same
// "webhook hits a Next.js Route Handler" shape already used for Stripe
// (src/app/api/webhooks/stripe/route.ts) and cron
// (src/app/api/cron/settle-auctions/route.ts), just triggered by Postgres
// instead of Stripe or a schedule.
type ChatMessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_type: string | null;
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.PUSH_WEBHOOK_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const record: ChatMessageRecord | undefined = payload?.record;
  if (!record) return NextResponse.json({ ok: true, skipped: "no record" });

  const admin = createAdminClient();

  const [{ data: recipients }, { data: sender }] = await Promise.all([
    admin.from("chat_participants").select("user_id").eq("conversation_id", record.conversation_id).neq("user_id", record.sender_id),
    admin.from("profiles").select("username, full_name").eq("id", record.sender_id).maybeSingle(),
  ]);

  if (!recipients || recipients.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const { data: tokens } = await admin
    .from("push_tokens")
    .select("expo_push_token")
    .in(
      "user_id",
      recipients.map((r) => r.user_id)
    );

  if (!tokens || tokens.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const senderName = sender?.full_name || sender?.username || "Someone";
  const previewBody = record.body || (record.media_type === "image" ? "📷 Photo" : record.media_type === "video" ? "🎥 Video" : "New message");

  const messages = tokens.map((t) => ({
    to: t.expo_push_token,
    sound: "default",
    title: senderName,
    body: previewBody,
    data: { conversationId: record.conversation_id },
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(messages),
  });

  return NextResponse.json({ ok: true, sent: messages.length });
}
