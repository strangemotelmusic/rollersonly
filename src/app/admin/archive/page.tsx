import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ArchiveAdminClient from "./ArchiveAdminClient";

export default async function AdminArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: items } = await admin
    .from("archive_media")
    .select("id, title, description, media_url, media_type, thumbnail_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Manage The Spin Vault
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Upload old photos and videos for members to browse. Any video format is accepted — anything not
            already web-playable gets converted right in your browser before upload, so it plays back
            reliably for everyone.
          </p>

          <ArchiveAdminClient currentUserId={user.id} initialItems={items ?? []} />
        </div>
      </div>
      <Footer />
    </>
  );
}
