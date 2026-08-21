import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { getConversationMembers } from "@/lib/chat/conversations";

// Mobile equivalent of src/app/actions/chat.ts's getConversationMembers().
export async function POST(request: NextRequest) {
  const gate = await requireMobileUser(request);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await request.json().catch(() => null);
  const conversationId = body?.conversationId;
  if (!conversationId) return NextResponse.json({ error: "conversationId is required." }, { status: 400 });

  const result = await getConversationMembers(conversationId, gate.userId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json(result);
}
