"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type OurBreederUpdate = Database["public"]["Tables"]["our_breeders"]["Update"];

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

async function uploadPhotos(admin: ReturnType<typeof createAdminClient>, formData: FormData): Promise<{ error: string } | { urls: string[] }> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("our-breeders-photos").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    urls.push(admin.storage.from("our-breeders-photos").getPublicUrl(path).data.publicUrl);
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

export async function createOurBreeder(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const parsed = parseBreederFields(formData);
  if ("error" in parsed) return parsed;

  const uploaded = await uploadPhotos(admin, formData);
  if ("error" in uploaded) return uploaded;

  const { data: maxRow } = await admin
    .from("our_breeders")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("our_breeders").insert({
    ...parsed.fields,
    photo_urls: uploaded.urls,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateOurBreeder(id: string, formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const parsed = parseBreederFields(formData);
  if ("error" in parsed) return parsed;

  const uploaded = await uploadPhotos(admin, formData);
  if ("error" in uploaded) return uploaded;

  const update: OurBreederUpdate = { ...parsed.fields, updated_at: new Date().toISOString() };

  if (uploaded.urls.length > 0) {
    const { data: existing } = await admin.from("our_breeders").select("photo_urls").eq("id", id).maybeSingle();
    update.photo_urls = [...(existing?.photo_urls ?? []), ...uploaded.urls];
  }

  const { error } = await admin.from("our_breeders").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function removeOurBreederPhoto(id: string, url: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { data: existing } = await admin.from("our_breeders").select("photo_urls").eq("id", id).maybeSingle();
  if (!existing) return { error: "Breeder not found." };

  const photo_urls = existing.photo_urls.filter((u) => u !== url);
  const { error } = await admin.from("our_breeders").update({ photo_urls, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteOurBreeder(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("our_breeders").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
