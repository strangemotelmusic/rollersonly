import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import MasterFliersClient from "./MasterFliersClient";

// Official NBRC Master Flier Ranking - real competitor data pulled directly
// from nbrc.us/master-flier-ranking-1/ (TablePress table id 99), not
// fabricated. Source page confirmed 1,388 flyers; imported 2026-09-10.
export default async function MasterFliersPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("master_fliers")
    .select("id, rank, name, location, deceased, year_awarded, points")
    .order("rank", { ascending: true });

  return (
    <>
      <Nav active="/master-fliers" />
      <MasterFliersClient fliers={data ?? []} />
      <Footer />
    </>
  );
}
