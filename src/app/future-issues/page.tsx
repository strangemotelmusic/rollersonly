import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import FutureIssuesClient from "./FutureIssuesClient";

export default async function FutureIssuesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: issues }, { data: videos }, adminRow] = await Promise.all([
    admin
      .from("future_issues")
      .select("id, title, release_label, description, cover_url")
      .order("sort_order", { ascending: true }),
    admin
      .from("featured_videos")
      .select("id, title, youtube_id, source, video_url, submitted_by, profiles(username, full_name)")
      .order("sort_order", { ascending: true }),
    user ? admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const shapedVideos = (videos ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    youtube_id: v.youtube_id,
    source: v.source,
    video_url: v.video_url,
    submittedByName: v.submitted_by ? v.profiles?.full_name || v.profiles?.username || null : null,
  }));

  return (
    <>
      <Nav active="/future-issues" />
      <FutureIssuesClient issues={issues ?? []} videos={shapedVideos} isAdmin={Boolean(adminRow?.data?.is_admin)} isSignedIn={Boolean(user)} />
      <Footer />
    </>
  );
}
