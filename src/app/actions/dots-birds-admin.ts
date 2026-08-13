"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type DotsBirdUpdate = Database["public"]["Tables"]["dots_birds"]["Update"];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." } as const;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only." } as const;

  return { admin } as const;
}

export async function createDotsBird(formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const name = String(formData.get("name") || "").trim();
  const bandNumber = String(formData.get("bandNumber") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceRaw = String(formData.get("price") || "");
  const price = Number(priceRaw);

  if (!name) return { error: "Bird name is required." };
  if (!priceRaw || !Number.isFinite(price) || price <= 0) return { error: "Enter a valid price." };

  let photoUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("dots-birds").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    photoUrl = admin.storage.from("dots-birds").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin.from("dots_birds").insert({
    name,
    band_number: bandNumber || null,
    age: age || null,
    description: description || null,
    price_cents: Math.round(price * 100),
    photo_url: photoUrl,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateDotsBird(id: string, formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const name = String(formData.get("name") || "").trim();
  const bandNumber = String(formData.get("bandNumber") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceRaw = String(formData.get("price") || "");
  const price = Number(priceRaw);

  if (!name) return { error: "Bird name is required." };
  if (!priceRaw || !Number.isFinite(price) || price <= 0) return { error: "Enter a valid price." };

  const update: DotsBirdUpdate = {
    name,
    band_number: bandNumber || null,
    age: age || null,
    description: description || null,
    price_cents: Math.round(price * 100),
    updated_at: new Date().toISOString(),
  };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("dots-birds").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    update.photo_url = admin.storage.from("dots-birds").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin.from("dots_birds").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function setDotsBirdAvailability(id: string, isAvailable: boolean) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin
    .from("dots_birds")
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteDotsBird(id: string) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("dots_birds").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
