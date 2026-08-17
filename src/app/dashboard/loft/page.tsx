import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import LoftDashboardClient, { type Bird, type Season, type FlyLogEntry } from "./LoftDashboardClient";

export default async function LoftDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  await ensureProfile(user);

  const { data: loft } = await supabase.from("lofts").select("id, name").eq("owner_id", user.id).maybeSingle();

  // The bare sire:sire_id(...)/dam:dam_id(...) self-referencing embed is
  // flagged as ambiguous by Supabase's static type generator (it wants a
  // birds!<column> hint), but that hint form returns wrong (empty) results
  // at runtime for this project - verified in src/app/birds/[id]/page.tsx.
  // Cast past the resulting (incorrect) SelectQueryError type.
  const { data: birdsRaw } = await supabase
    .from("birds")
    .select(
      `id, name, ring_number, sex, color, birth_year, primary_photo_url, is_active,
       sire:sire_id(id, name, ring_number), dam:dam_id(id, name, ring_number),
       auctions(id, status)`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const birds = birdsRaw as unknown as Bird[] | null;

  const { data: seasonsRaw } = await supabase
    .from("breeding_seasons")
    .select(
      `id, label, start_date, end_date, notes,
       breeding_pairs(id, sire_id, dam_id, paired_at, egg_count, hatched_count, status, notes,
         sire:sire_id(id, name, ring_number), dam:dam_id(id, name, ring_number))`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const seasons = seasonsRaw as unknown as Season[] | null;

  const { data: flyLog } = await supabase
    .from("fly_log_entries")
    .select("id, bird_id, logged_at, depth, frequency, kit_behavior, notes")
    .eq("owner_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(100);
  const flyLogEntries = flyLog as unknown as FlyLogEntry[] | null;

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
            Track every bird you keep, not just the ones for sale — register bloodlines, manage breeding seasons and pairs,
            and log fly performance notes.
          </p>

          <LoftDashboardClient
            ownerId={user.id}
            loftId={loft?.id ?? null}
            initialBirds={birds ?? []}
            initialSeasons={seasons ?? []}
            initialFlyLog={flyLogEntries ?? []}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
