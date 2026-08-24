import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import type { Json } from "@/lib/supabase/database.types";

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/our-breeders-photos/`;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const { data } = await admin
    .from("our_breeders")
    .select("id, name, sex, color, bloodline, ring_number, flying_record, loft_record, bio, photo_urls, photo_settings, sort_order")
    .order("sort_order");

  return NextResponse.json({ breeders: data ?? [] });
}

function parseFields(body: any): { error: string } | { fields: Record<string, unknown> } {
  const name = String(body.name || "").trim();
  const sex = String(body.sex || "").trim();
  if (!name) return { error: "Name is required." };
  if (sex && sex !== "cock" && sex !== "hen") return { error: "Invalid sex." };

  return {
    fields: {
      name,
      sex: sex || null,
      color: body.color ? String(body.color).trim() : null,
      bloodline: body.bloodline ? String(body.bloodline).trim() : null,
      ring_number: body.ringNumber ? String(body.ringNumber).trim() : null,
      flying_record: body.flyingRecord ? String(body.flyingRecord).trim() : null,
      loft_record: body.loftRecord ? String(body.loftRecord).trim() : null,
      bio: body.bio ? String(body.bio).trim() : null,
    },
  };
}

function validatePhotoUrls(urls: unknown): { error: string } | { urls: string[] } {
  if (!Array.isArray(urls)) return { urls: [] };
  if (!urls.every((u) => typeof u === "string" && u.startsWith(PHOTO_URL_PREFIX))) {
    return { error: "Photo list contained an unexpected URL." };
  }
  return { urls: urls as string[] };
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  const action: string | undefined = body?.action;

  if (action === "delete") {
    const { error } = await admin.from("our_breeders").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove-photo") {
    const { data: existing } = await admin.from("our_breeders").select("photo_urls, photo_settings").eq("id", body.id).maybeSingle();
    if (!existing) return NextResponse.json({ error: "Breeder not found." }, { status: 404 });
    const photo_urls = existing.photo_urls.filter((u: string) => u !== body.url);
    const settings = { ...((existing.photo_settings as Record<string, unknown>) ?? {}) };
    delete settings[body.url];
    const { error } = await admin
      .from("our_breeders")
      .update({ photo_urls, photo_settings: settings as unknown as Json, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "set-crop") {
    const { url, x, y, zoom } = body;
    if (typeof url !== "string" || !url.startsWith(PHOTO_URL_PREFIX)) return NextResponse.json({ error: "Unexpected photo URL." }, { status: 400 });
    if (![x, y, zoom].every((n) => typeof n === "number" && Number.isFinite(n))) return NextResponse.json({ error: "Invalid crop values." }, { status: 400 });
    if (x < 0 || x > 100 || y < 0 || y > 100 || zoom < 1 || zoom > 4) return NextResponse.json({ error: "Crop values out of range." }, { status: 400 });

    const { data: existing } = await admin.from("our_breeders").select("photo_settings").eq("id", body.id).maybeSingle();
    if (!existing) return NextResponse.json({ error: "Breeder not found." }, { status: 404 });
    const photo_settings = { ...((existing.photo_settings as Record<string, unknown>) ?? {}), [url]: { x, y, zoom } };

    const { error } = await admin
      .from("our_breeders")
      .update({ photo_settings: photo_settings as unknown as Json, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "create" || action === "update") {
    const parsed = parseFields(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const validated = validatePhotoUrls(body.newPhotoUrls);
    if ("error" in validated) return NextResponse.json({ error: validated.error }, { status: 400 });

    if (action === "create") {
      const { data: maxRow } = await admin.from("our_breeders").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await admin.from("our_breeders").insert({
        ...parsed.fields,
        photo_urls: validated.urls,
        sort_order: (maxRow?.sort_order ?? 0) + 1,
      } as never);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const update: Record<string, unknown> = { ...parsed.fields, updated_at: new Date().toISOString() };
    if (validated.urls.length > 0) {
      const { data: existing } = await admin.from("our_breeders").select("photo_urls").eq("id", body.id).maybeSingle();
      update.photo_urls = [...(existing?.photo_urls ?? []), ...validated.urls];
    }
    const { error } = await admin.from("our_breeders").update(update as never).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
