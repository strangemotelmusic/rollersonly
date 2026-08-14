import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LiveAuctionsAdminClient from "./LiveAuctionsAdminClient";

export default async function AdminLiveAuctionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: cards } = await admin
    .from("live_auction_cards")
    .select("id, name, color, bloodline, loft_name, location, price_cents, bid_count, status, ends_at, schedule_label, tags, image_url, featured_home, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Manage Live Auctions
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Edit the price, color, bloodline, loft, and photo for every card shown on the homepage and the Live Auctions page.
          </p>

          <LiveAuctionsAdminClient initialCards={cards ?? []} />
        </div>
      </div>
      <Footer />
    </>
  );
}
