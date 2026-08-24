import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import type { Database } from "@/lib/supabase/database.types";

type DotsBirdUpdate = Database["public"]["Tables"]["dots_birds"]["Update"];

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dots-birds/`;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const { data } = await admin
    .from("dots_birds")
    .select("id, name, band_number, age, description, price_cents, photo_url, is_available")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return NextResponse.json({ birds: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  const action: string | undefined = body?.action;

  if (action === "delete") {
    const { error } = await admin.from("dots_birds").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "set-availability") {
    const { error } = await admin
      .from("dots_birds")
      .update({ is_available: !!body.isAvailable, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "create" || action === "update") {
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    if (!name) return NextResponse.json({ error: "Bird name is required." }, { status: 400 });
    if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });

    let photoUrl: string | undefined;
    if (body.photoUrl) {
      if (!String(body.photoUrl).startsWith(PHOTO_URL_PREFIX)) {
        return NextResponse.json({ error: "Unexpected photo URL." }, { status: 400 });
      }
      photoUrl = body.photoUrl;
    }

    const fields = {
      name,
      band_number: body.bandNumber ? String(body.bandNumber).trim() : null,
      age: body.age ? String(body.age).trim() : null,
      description: body.description ? String(body.description).trim() : null,
      price_cents: Math.round(price * 100),
    };

    if (action === "create") {
      const { error } = await admin.from("dots_birds").insert({ ...fields, photo_url: photoUrl ?? null });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const update: DotsBirdUpdate = { ...fields, updated_at: new Date().toISOString() };
    if (photoUrl) update.photo_url = photoUrl;
    const { error } = await admin.from("dots_birds").update(update).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
