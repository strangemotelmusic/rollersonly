"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitVideoForReview(title: string, videoUrl: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: "Give your video a title." };
  if (!videoUrl) return { error: "No video was uploaded." };

  const { error } = await supabase.from("video_submissions").insert({
    user_id: user.id,
    title: trimmedTitle,
    video_url: videoUrl,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
