"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type OurBreeder = Database["public"]["Tables"]["our_breeders"]["Row"];
type OurBreederUpdate = Database["public"]["Tables"]["our_breeders"]["Update"];

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/our-breeders-photos/`;

async function requireAdmin(): Promise<{ error: string } | { admin: ReturnType<typeof createAdminClient> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only." };

  return { admin };
}

function parseNewPhotoUrls(formData: FormData): { error: string } | { urls: string[] } {
  const raw = String(formData.get("newPhotoUrls") || "[]");
  let urls: unknown;
  try {
    urls = JSON.parse(raw);
  } catch {
    return { error: "Malformed photo list." };
  }
  if (!Array.isArray(urls) || !urls.every((u) => typeof u === "string" && u.startsWith(PHOTO_URL_PREFIX))) {
    return { error: "Photo list contained an unexpected URL." };
  }
  return { urls };
}

type ParsedBreederFields = {
  name: string;
  sex: string | null;
  color: string | null;
  bloodline: string | null;
  ring_number: string | null;
  flying_record: string | null;
  loft_record: string | null;
  bio: string | null;
};

function parseBreederFields(formData: FormData): { error: string } | { fields: ParsedBreederFields } {
  const name = String(formData.get("name") || "").trim();
  const sex = String(formData.get("sex") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const bloodline = String(formData.get("bloodline") || "").trim();
  const ringNumber = String(formData.get("ringNumber") || "").trim();
  const flyingRecord = String(formData.get("flyingRecord") || "").trim();
  const loftRecord = String(formData.get("loftRecord") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (!name) return { error: "Name is required." };
  if (sex && sex !== "cock" && sex !== "hen") return { error: "Invalid sex." };

  return {
    fields: {
      name,
      sex: sex || null,
      color: color || null,
      bloodline: bloodline || null,
      ring_number: ringNumber || null,
      flying_record: flyingRecord || null,
      loft_record: loftRecord || null,
      bio: bio || null,
    },
  };
}

export async function createOurBreeder(formData: FormData): Promise<{ error: string } | { ok: true; breeder: OurBreeder }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const parsed = parseBreederFields(formData);
  if ("error" in parsed) return parsed;

  const uploaded = parseNewPhotoUrls(formData);
  if ("error" in uploaded) return uploaded;

  const { data: maxRow } = await admin
    .from("our_breeders")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("our_breeders")
    .insert({
      ...parsed.fields,
      photo_urls: uploaded.urls,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { ok: true, breeder: data };
}

export async function updateOurBreeder(id: string, formData: FormData): Promise<{ error: string } | { ok: true; breeder: OurBreeder }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const parsed = parseBreederFields(formData);
  if ("error" in parsed) return parsed;

  const uploaded = parseNewPhotoUrls(formData);
  if ("error" in uploaded) return uploaded;

  const update: OurBreederUpdate = { ...parsed.fields, updated_at: new Date().toISOString() };

  if (uploaded.urls.length > 0) {
    const { data: existing } = await admin.from("our_breeders").select("photo_urls").eq("id", id).maybeSingle();
    update.photo_urls = [...(existing?.photo_urls ?? []), ...uploaded.urls];
  }

  const { data, error } = await admin.from("our_breeders").update(update).eq("id", id).select().single();
  if (error) return { error: error.message };
  return { ok: true, breeder: data };
}

export async function removeOurBreederPhoto(id: string, url: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { data: existing } = await admin.from("our_breeders").select("photo_urls, photo_settings").eq("id", id).maybeSingle();
  if (!existing) return { error: "Breeder not found." };

  const photo_urls = existing.photo_urls.filter((u) => u !== url);
  const settings = { ...((existing.photo_settings as Record<string, unknown>) ?? {}) };
  delete settings[url];

  const { error } = await admin
    .from("our_breeders")
    .update({ photo_urls, photo_settings: settings as unknown as Json, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateOurBreederPhotoSettings(
  id: string,
  url: string,
  settings: { x: number; y: number; zoom: number }
): Promise<{ error: string } | { ok: true; breeder: OurBreeder }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  if (!url.startsWith(PHOTO_URL_PREFIX)) return { error: "Unexpected photo URL." };
  const { x, y, zoom } = settings;
  if (![x, y, zoom].every((n) => typeof n === "number" && Number.isFinite(n))) return { error: "Invalid crop values." };
  if (x < 0 || x > 100 || y < 0 || y > 100 || zoom < 1 || zoom > 4) return { error: "Crop values out of range." };

  const { data: existing } = await admin.from("our_breeders").select("photo_settings").eq("id", id).maybeSingle();
  if (!existing) return { error: "Breeder not found." };

  const photo_settings = { ...((existing.photo_settings as Record<string, unknown>) ?? {}), [url]: { x, y, zoom } };

  const { data, error } = await admin
    .from("our_breeders")
    .update({ photo_settings: photo_settings as unknown as Json, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { error: error.message };
  return { ok: true, breeder: data };
}

export async function deleteOurBreeder(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("our_breeders").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
