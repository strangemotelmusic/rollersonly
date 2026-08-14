import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import SpinVaultClient from "./SpinVaultClient";

export default async function SpinVaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  await ensureProfile(user);

  const [{ data: items }, { data: likes }, { data: comments }] = await Promise.all([
    supabase
      .from("archive_media")
      .select("id, title, description, media_url, media_type, thumbnail_url, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("archive_likes").select("archive_id, user_id"),
    supabase.from("archive_comments").select("archive_id"),
  ]);

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likes ?? []) {
    likeCounts.set(like.archive_id, (likeCounts.get(like.archive_id) ?? 0) + 1);
    if (like.user_id === user.id) likedByMe.add(like.archive_id);
  }

  const commentCounts = new Map<string, number>();
  for (const comment of comments ?? []) {
    commentCounts.set(comment.archive_id, (commentCounts.get(comment.archive_id) ?? 0) + 1);
  }

  const enrichedItems = (items ?? []).map((item) => ({
    ...item,
    likeCount: likeCounts.get(item.id) ?? 0,
    likedByMe: likedByMe.has(item.id),
    commentCount: commentCounts.get(item.id) ?? 0,
  }));

  return (
    <>
      <Nav active="/spin-vault" />
      <SpinVaultClient currentUserId={user.id} initialItems={enrichedItems} />
      <Footer />
    </>
  );
}
