import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import TysonsCornerAdminClient from "./TysonsCornerAdminClient";

const BLOODLINES = ["Hannes", "Poen", "McKinney"];

export default async function AdminTysonsCornerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: birds }, { data: gallery }] = await Promise.all([
    admin
      .from("dots_birds")
      .select("id, name, band_number, age, price_cents, description, photo_url, photo_urls, is_available, bloodline")
      .in("bloodline", BLOODLINES)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    admin
      .from("tysons_corner_gallery")
      .select("id, image_url, caption, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Manage Tyson&apos;s Corner
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Edit the Hannes, Poen, and McKinney bloodline birds, their photo galleries, and the general Tyson&apos;s
            Corner photo gallery shown on the public page.
          </p>

          <TysonsCornerAdminClient initialBirds={birds ?? []} initialGallery={gallery ?? []} />
        </div>
      </div>
      <Footer />
    </>
  );
}
