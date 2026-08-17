import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import LoftDashboardClient, { type Bird } from "./LoftDashboardClient";

export default async function LoftDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  await ensureProfile(user);

  const { data: loft } = await supabase.from("lofts").select("id, name").eq("owner_id", user.id).maybeSingle();

  const { data: birds } = await supabase
    .from("birds")
    .select("id, name, ring_number, sex, color, birth_year, primary_photo_url, is_active, auctions(id, status)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
            {loft?.name || "Your Loft"}
          </p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>My Loft</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40, maxWidth: 640 }}>
            Track every bird you keep, not just the ones for sale — register birds and manage listings independently
            of your auctions.
          </p>

          <LoftDashboardClient ownerId={user.id} loftId={loft?.id ?? null} initialBirds={(birds ?? []) as Bird[]} />
        </div>
      </div>
      <Footer />
    </>
  );
}
