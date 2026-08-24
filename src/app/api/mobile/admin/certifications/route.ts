import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import { getCertificationEligibility } from "@/lib/certification";

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const { data: pending } = await admin
    .from("birds")
    .select("id, name, ring_number, certification_requested_at, profiles!birds_owner_id_fkey(username, full_name)")
    .eq("certification_status", "pending")
    .order("certification_requested_at", { ascending: true });

  const withEligibility = await Promise.all(
    (pending ?? []).map(async (bird) => ({ bird, eligibility: await getCertificationEligibility(bird.id) }))
  );

  return NextResponse.json({ pending: withEligibility });
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  const birdId: string | undefined = body?.birdId;
  const approve: boolean | undefined = body?.approve;
  if (!birdId || typeof approve !== "boolean") {
    return NextResponse.json({ error: "birdId and approve are required." }, { status: 400 });
  }

  const { error } = await admin
    .from("birds")
    .update({ certification_status: approve ? "certified" : "denied", certified_at: approve ? new Date().toISOString() : null })
    .eq("id", birdId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
