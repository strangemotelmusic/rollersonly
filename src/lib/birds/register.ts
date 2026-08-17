import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type RegisterBirdInput = {
  ownerId: string;
  loftId: string | null;
  name: string;
  ringNumber: string | null;
  sex: string;
  color: string | null;
  birthYear: number | null;
  notes: string | null;
  photos: File[];
};

/**
 * Inserts a bird into the owner's loft WITHOUT creating an auction — the
 * lightweight "register, don't list" path. Mirrors the direct-client-write
 * pattern already used by ListBirdForm.tsx (birds/auctions RLS already
 * allows owner-scoped inserts, no server action needed).
 */
export async function registerBird(
  supabase: Client,
  input: RegisterBirdInput
): Promise<{ error: string } | { ok: true; birdId: string }> {
  if (!input.name.trim()) return { error: "Bird name is required." };

  const uploadedUrls: string[] = [];
  for (const file of input.photos) {
    const path = `${input.ownerId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("bird-photos").upload(path, file);
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
    uploadedUrls.push(supabase.storage.from("bird-photos").getPublicUrl(path).data.publicUrl);
  }
  const primaryPhotoUrl = uploadedUrls[0] ?? null;
  const platformId = `RO-${Date.now().toString(36).toUpperCase()}`;

  const { data: bird, error: birdErr } = await supabase
    .from("birds")
    .insert({
      platform_id: platformId,
      owner_id: input.ownerId,
      loft_id: input.loftId,
      name: input.name,
      ring_number: input.ringNumber,
      sex: input.sex,
      color: input.color,
      birth_year: input.birthYear,
      primary_photo_url: primaryPhotoUrl,
      notes: input.notes,
      is_active: false,
    })
    .select("id")
    .single();

  if (birdErr || !bird) return { error: birdErr?.message || "Could not register bird." };

  if (uploadedUrls.length > 0) {
    const { error: photosErr } = await supabase
      .from("bird_photos")
      .insert(uploadedUrls.map((url, i) => ({ bird_id: bird.id, url, is_primary: i === 0, sort_order: i })));
    if (photosErr) return { error: photosErr.message };
  }

  return { ok: true, birdId: bird.id };
}

export type ListForSaleInput = {
  sellerId: string;
  loftId: string | null;
  title: string;
  description: string | null;
  startingBid: number;
  reservePrice: number;
  bidIncrement: number;
  durationHours: number;
};

/** Creates the auction row for an already-registered bird and flips it active. */
export async function listBirdForSale(
  supabase: Client,
  birdId: string,
  input: ListForSaleInput
): Promise<{ error: string } | { ok: true; auctionId: string }> {
  if (input.startingBid <= 0) return { error: "Starting bid must be greater than $0." };

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + input.durationHours * 3_600_000);

  const { data: auction, error: auctionErr } = await supabase
    .from("auctions")
    .insert({
      bird_id: birdId,
      seller_id: input.sellerId,
      loft_id: input.loftId,
      title: input.title,
      description: input.description,
      reserve_price: input.reservePrice,
      starting_bid: input.startingBid,
      bid_increment: input.bidIncrement,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "live",
    })
    .select("id")
    .single();

  if (auctionErr || !auction) return { error: auctionErr?.message || "Could not create auction." };

  const { error: birdErr } = await supabase.from("birds").update({ is_active: true }).eq("id", birdId);
  if (birdErr) return { error: birdErr.message };

  return { ok: true, auctionId: auction.id };
}
