import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";

const IMAGE_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tysons-corner-gallery/`;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const { data } = await admin
    .from("tysons_corner_gallery")
    .select("id, image_url, caption, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return NextResponse.json({ photos: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  const action: string | undefined = body?.action;

  if (action === "add") {
    const imageUrl = String(body.imageUrl || "");
    if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) return NextResponse.json({ error: "Unexpected photo URL." }, { status: 400 });

    const { error } = await admin.from("tysons_corner_gallery").insert({
      image_url: imageUrl,
      caption: body.caption ? String(body.caption).trim() || null : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await admin.from("tysons_corner_gallery").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
