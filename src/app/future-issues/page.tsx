import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import FutureIssuesClient from "./FutureIssuesClient";

export default async function FutureIssuesPage() {
  const admin = createAdminClient();
  const [{ data: issues }, { data: videos }] = await Promise.all([
    admin
      .from("future_issues")
      .select("id, title, release_label, description, cover_url")
      .order("sort_order", { ascending: true }),
    admin
      .from("featured_videos")
      .select("id, title, youtube_id")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <Nav active="/future-issues" />
      <FutureIssuesClient issues={issues ?? []} videos={videos ?? []} />
      <Footer />
    </>
  );
}
