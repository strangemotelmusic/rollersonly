import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import type { Database } from "@/lib/supabase/database.types";

type CardUpdate = Database["public"]["Tables"]["live_auction_cards"]["Update"];

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/live-auction-photos/`;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const { data } = await admin
    .from("live_auction_cards")
    .select("id, name, color, bloodline, loft_name, location, price_cents, bid_count, status, ends_at, schedule_label, tags, image_url, featured_home, sort_order")
    .order("sort_order");

  return NextResponse.json({ cards: data ?? [] });
}

function parseFields(body: any): { error: string } | { fields: Record<string, unknown> } {
  const name = String(body.name || "").trim();
  const loftName = String(body.loftName || "").trim();
  const price = Number(body.price);
  const bidCount = Number(body.bidCount ?? 0);
  const status = String(body.status || "live");

  if (!name) return { error: "Bird name is required." };
  if (!loftName) return { error: "Loft name is required." };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a valid price." };
  if (!Number.isFinite(bidCount) || bidCount < 0) return { error: "Enter a valid bid count." };
  if (status !== "live" && status !== "upcoming") return { error: "Invalid status." };

  const tags: string[] = Array.isArray(body.tags) ? body.tags.map((t: string) => t.trim()).filter(Boolean) : [];

  let endsAt: string | null = null;
  if (status === "live" && body.endsInHours) {
    const hours = Number(body.endsInHours);
    if (!Number.isFinite(hours) || hours <= 0) return { error: "Enter valid hours remaining." };
    endsAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  }

  return {
    fields: {
      name,
      color: body.color ? String(body.color).trim() : null,
      bloodline: body.bloodline ? String(body.bloodline).trim() : null,
      loft_name: loftName,
      location: body.location ? String(body.location).trim() : null,
      price_cents: Math.round(price * 100),
      bid_count: Math.round(bidCount),
      status,
      ends_at: status === "live" ? endsAt : null,
      schedule_label: status === "upcoming" ? (body.scheduleLabel ? String(body.scheduleLabel).trim() : null) : null,
      tags,
      featured_home: !!body.featuredHome,
    },
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  if (body.action === "delete") {
    const { error } = await admin.from("live_auction_cards").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action !== "create" && body.action !== "update") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const parsed = parseFields(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let imageUrl: string | undefined;
  if (body.imageUrl) {
    if (!String(body.imageUrl).startsWith(PHOTO_URL_PREFIX)) {
      return NextResponse.json({ error: "Unexpected photo URL." }, { status: 400 });
    }
    imageUrl = body.imageUrl;
  }

  if (body.action === "create") {
    const { data: maxRow } = await admin.from("live_auction_cards").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await admin.from("live_auction_cards").insert({
      ...parsed.fields,
      image_url: imageUrl ?? null,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    } as never);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const update: CardUpdate = { ...parsed.fields, updated_at: new Date().toISOString() };
  if (imageUrl) update.image_url = imageUrl;
  const { error } = await admin.from("live_auction_cards").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
