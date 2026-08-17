import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import FutureIssuesAdminClient from "./FutureIssuesAdminClient";

export default async function AdminFutureIssuesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: issues }, { data: videos }, { data: submissionsRaw }] = await Promise.all([
    admin.from("future_issues").select("id, title, release_label, description, cover_url, sort_order").order("sort_order", { ascending: true }),
    admin.from("featured_videos").select("id, title, youtube_id, source, video_url, sort_order").order("sort_order", { ascending: true }),
    admin
      .from("video_submissions")
      .select("id, title, video_url, status, created_at, profiles(username, full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const submissions = (submissionsRaw ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    video_url: s.video_url,
    created_at: s.created_at,
    submitterName: s.profiles?.full_name || s.profiles?.username || "A member",
  }));

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Future Issues &amp; Big Screen
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Upload upcoming issue covers and paste YouTube links to play on the big screen — both appear on the public{" "}
            <a href="/future-issues" style={{ color: "var(--gold)" }}>Future Issues</a> page.
          </p>

          <FutureIssuesAdminClient initialIssues={issues ?? []} initialVideos={videos ?? []} initialSubmissions={submissions} />
        </div>
      </div>
      <Footer />
    </>
  );
}
