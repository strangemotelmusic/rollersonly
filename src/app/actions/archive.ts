"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." } as const;
  await ensureProfile(user);
  return { user, supabase } as const;
}

export async function toggleArchiveLike(archiveId: string) {
  const gate = await requireUser();
  if ("error" in gate) return gate;
  const { user, supabase } = gate;

  const { data: existing } = await supabase
    .from("archive_likes")
    .select("id")
    .eq("archive_id", archiveId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("archive_likes").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    return { ok: true, liked: false } as const;
  }

  const { error } = await supabase.from("archive_likes").insert({ archive_id: archiveId, user_id: user.id });
  if (error) return { error: error.message };
  return { ok: true, liked: true } as const;
}

export async function addArchiveComment(archiveId: string, body: string) {
  const gate = await requireUser();
  if ("error" in gate) return gate;
  const { user, supabase } = gate;

  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment can't be empty." } as const;
  if (trimmed.length > 1000) return { error: "Comment is too long." } as const;

  const { data, error } = await supabase
    .from("archive_comments")
    .insert({ archive_id: archiveId, user_id: user.id, body: trimmed })
    .select("id, body, created_at, user_id, profiles(username, full_name, avatar_url)")
    .single();

  if (error) return { error: error.message };
  return { ok: true, comment: data } as const;
}

export async function deleteArchiveComment(commentId: string) {
  const gate = await requireUser();
  if ("error" in gate) return gate;
  const { supabase } = gate;

  const { error } = await supabase.from("archive_comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  return { ok: true } as const;
}
