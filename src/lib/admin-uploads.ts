import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

// Uploads straight from the browser to Supabase Storage, bypassing the app
// server entirely. Server actions were previously receiving the raw File
// inside FormData, which does two bad things: routes every image through
// a slow client -> Vercel -> Supabase double-hop, and silently hits
// Next.js's default 1MB server-action body cap on anything but a small,
// heavily-compressed photo. RLS on each bucket restricts writes to admins.
export async function uploadAdminImage(
  supabase: Client,
  bucket: string,
  file: File
): Promise<{ error: string } | { url: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) return { error: `Upload failed: ${error.message}` };
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}
