import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { createGroupConversation } from "@/lib/chat/conversations";

// Mobile equivalent of src/app/actions/chat.ts's createGroupChat().
export async function POST(request: NextRequest) {
  const gate = await requireMobileUser(request);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const memberIds: string[] = Array.isArray(body?.memberIds) ? body.memberIds : [];
  if (!name) return NextResponse.json({ error: "Group name is required." }, { status: 400 });

  const result = await createGroupConversation(gate.userId, memberIds, name);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
