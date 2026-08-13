import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import MagazineAdminClient from "./MagazineAdminClient";

export default async function AdminMagazinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: issues } = await admin
    .from("magazine_issues")
    .select("id, issue_number, title, description, content, cover_image_url, published_at")
    .order("issue_number", { ascending: false });

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Manage Decade of the Spinner
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Add, edit, or remove magazine issues. Breeder and Elite Loft members read the full issue; everyone else
            sees an excerpt of the latest one.
          </p>

          <MagazineAdminClient initialIssues={issues ?? []} />
        </div>
      </div>
      <Footer />
    </>
  );
}
