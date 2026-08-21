import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { findOrCreateDirectConversation } from "@/lib/chat/conversations";

// Mobile equivalent of src/app/actions/chat.ts's startDirectMessage().
export async function POST(request: NextRequest) {
  const gate = await requireMobileUser(request);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await request.json().catch(() => null);
  const otherUserId = body?.otherUserId;
  if (!otherUserId) return NextResponse.json({ error: "otherUserId is required." }, { status: 400 });

  const result = await findOrCreateDirectConversation(gate.userId, otherUserId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
