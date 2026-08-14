import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OurBreedersAdminClient from "./OurBreedersAdminClient";

export default async function AdminOurBreedersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: breeders } = await admin
    .from("our_breeders")
    .select("id, name, sex, color, bloodline, ring_number, flying_record, loft_record, bio, photo_urls, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Manage Our Breeders
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Add and edit the foundation breeder birds shown on the public &quot;Our Breeders&quot; page — name, bloodline,
            flying and loft performance history, and photos.
          </p>

          <OurBreedersAdminClient initialBreeders={breeders ?? []} />
        </div>
      </div>
      <Footer />
    </>
  );
}
