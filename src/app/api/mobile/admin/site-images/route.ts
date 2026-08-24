import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import { SITE_IMAGE_SLOTS, getSiteImageMeta, type SiteImageKey } from "@/lib/site-images";

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const meta = await getSiteImageMeta();
  const slots = SITE_IMAGE_SLOTS.map((slot) => ({ key: slot.key, ...meta[slot.key] }));
  return NextResponse.json({ slots });
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  const key: SiteImageKey | undefined = body?.key;
  const slot = SITE_IMAGE_SLOTS.find((s) => s.key === key);
  if (!slot) return NextResponse.json({ error: "Unknown image slot." }, { status: 400 });

  if (body.action === "rename") {
    const label = String(body.label || "").trim();
    if (!label) return NextResponse.json({ error: "Name can't be empty." }, { status: 400 });

    const { data: existing } = await admin.from("site_images").select("url").eq("key", slot.key).maybeSingle();
    const url = existing?.url ?? slot.defaultUrl;

    const { error } = await admin.from("site_images").upsert({ key: slot.key, label, url, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, label });
  }

  if (body.action === "replace") {
    const url = String(body.url || "");
    if (!url.startsWith(PHOTO_URL_PREFIX)) return NextResponse.json({ error: "Unexpected photo URL." }, { status: 400 });

    const { data: existing } = await admin.from("site_images").select("label").eq("key", slot.key).maybeSingle();
    const label = existing?.label ?? slot.label;

    const { error } = await admin.from("site_images").upsert({ key: slot.key, label, url, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: `Saved the upload, but failed to update the site: ${error.message}` }, { status: 500 });
    return NextResponse.json({ ok: true, url });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
