"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "bird-photos";

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

// bird_photos has no DELETE policy by design (RLS only allows owner-scoped
// insert + public select, matching the rest of the schema's soft-delete
// convention) - so this runs as a server action with the admin client,
// checking ownership manually, same pattern as the Stripe/matchmaking
// actions. A real hard delete (row + storage object) is intentional here:
// unlike core business records, a photo the owner wants gone should
// actually be gone.
export async function deleteBirdPhoto(photoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const admin = createAdminClient();

  const { data: photo } = await admin
    .from("bird_photos")
    .select("id, bird_id, url, birds(owner_id, primary_photo_url)")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo) return { error: "Photo not found." };
  if (photo.birds?.owner_id !== user.id) return { error: "You don't own this bird." };

  const { error: deleteErr } = await admin.from("bird_photos").delete().eq("id", photoId);
  if (deleteErr) return { error: deleteErr.message };

  const path = storagePathFromPublicUrl(photo.url);
  if (path) {
    await admin.storage.from(BUCKET).remove([path]);
  }

  // If the deleted photo was the bird's cover photo, promote whichever
  // photo is first in sort order - or clear it if none are left.
  if (photo.birds?.primary_photo_url === photo.url) {
    const { data: remaining } = await admin
      .from("bird_photos")
      .select("url")
      .eq("bird_id", photo.bird_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    await admin.from("birds").update({ primary_photo_url: remaining?.url ?? null }).eq("id", photo.bird_id);
  }

  return { ok: true };
}
