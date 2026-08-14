import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_IMAGE_SLOTS, getSiteImages } from "@/lib/site-images";
import SiteImageSlot from "./SiteImageSlot";

export default async function AdminSiteImagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const images = await getSiteImages();

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Site Images
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Replace the placeholder bird photos used across the homepage and the Live Auctions page. Each slot updates every place that photo appears.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SITE_IMAGE_SLOTS.map((slot) => (
              <SiteImageSlot key={slot.key} slotKey={slot.key} label={slot.label} url={images[slot.key]} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
