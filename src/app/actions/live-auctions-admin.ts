"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type LiveAuctionCardUpdate = Database["public"]["Tables"]["live_auction_cards"]["Update"];

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

type CardFields = {
  name: string;
  color: string | null;
  bloodline: string | null;
  loft_name: string;
  location: string | null;
  price_cents: number;
  bid_count: number;
  status: string;
  ends_at: string | null;
  schedule_label: string | null;
  tags: string[];
  featured_home: boolean;
};

function parseCardFields(formData: FormData): { error: string } | { fields: CardFields } {
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const bloodline = String(formData.get("bloodline") || "").trim();
  const loftName = String(formData.get("loftName") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const priceRaw = String(formData.get("price") || "");
  const price = Number(priceRaw);
  const bidCountRaw = String(formData.get("bidCount") || "0");
  const bidCount = Number(bidCountRaw);
  const status = String(formData.get("status") || "live");
  const scheduleLabel = String(formData.get("scheduleLabel") || "").trim();
  const endsInHours = String(formData.get("endsInHours") || "").trim();
  const tagsRaw = String(formData.get("tags") || "");
  const featuredHome = formData.get("featuredHome") === "on";

  if (!name) return { error: "Bird name is required." };
  if (!loftName) return { error: "Loft name is required." };
  if (!priceRaw || !Number.isFinite(price) || price < 0) return { error: "Enter a valid price." };
  if (!Number.isFinite(bidCount) || bidCount < 0) return { error: "Enter a valid bid count." };
  if (status !== "live" && status !== "upcoming") return { error: "Invalid status." };

  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  let endsAt: string | null = null;
  if (status === "live" && endsInHours) {
    const hours = Number(endsInHours);
    if (!Number.isFinite(hours) || hours <= 0) return { error: "Enter valid hours remaining." };
    endsAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  }

  return {
    fields: {
      name,
      color: color || null,
      bloodline: bloodline || null,
      loft_name: loftName,
      location: location || null,
      price_cents: Math.round(price * 100),
      bid_count: Math.round(bidCount),
      status,
      ends_at: status === "live" ? endsAt : null,
      schedule_label: status === "upcoming" ? scheduleLabel || null : null,
      tags,
      featured_home: featuredHome,
    },
  };
}

export async function createLiveAuctionCard(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const parsed = parseCardFields(formData);
  if ("error" in parsed) return parsed;

  let imageUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("live-auction-photos").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    imageUrl = admin.storage.from("live-auction-photos").getPublicUrl(path).data.publicUrl;
  }

  const { data: maxRow } = await admin
    .from("live_auction_cards")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("live_auction_cards").insert({
    ...parsed.fields,
    image_url: imageUrl,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateLiveAuctionCard(id: string, formData: FormData): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const parsed = parseCardFields(formData);
  if ("error" in parsed) return parsed;

  const update: LiveAuctionCardUpdate = { ...parsed.fields, updated_at: new Date().toISOString() };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("live-auction-photos").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    update.image_url = admin.storage.from("live-auction-photos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin.from("live_auction_cards").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteLiveAuctionCard(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("live_auction_cards").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
