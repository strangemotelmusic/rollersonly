import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { ensureChatMembership } from "@/lib/supabase/ensure-chat-membership";
import { getMyConversations } from "@/lib/chat/conversations";

// Mobile equivalent of src/app/actions/chat.ts's refreshConversations().
export async function GET(request: NextRequest) {
  const gate = await requireMobileUser(request);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  await ensureChatMembership(gate.userId);
  const conversations = await getMyConversations(gate.userId);
  return NextResponse.json({ conversations });
}
