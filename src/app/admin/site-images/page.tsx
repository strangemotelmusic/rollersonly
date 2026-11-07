import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_IMAGE_SLOTS, getSiteImageMeta } from "@/lib/site-images";
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

  const images = await getSiteImageMeta();

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Site Images
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Replace the site-wide decorative photos (hero, logo, homepage sections) and rename each slot — each slot
            updates every place that photo appears. This doesn&apos;t cover per-listing bird photos, loft logos, or
            magazine/D.O.T.S./Tyson&apos;s Corner content — those are managed from their own admin pages or directly
            by each owner. To edit Live Auctions cards, use{" "}
            <a href="/admin/live-auctions" style={{ color: "var(--gold)" }}>Manage Live Auctions</a>.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SITE_IMAGE_SLOTS.map((slot) => (
              <SiteImageSlot key={slot.key} slotKey={slot.key} label={images[slot.key].label} url={images[slot.key].url} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
