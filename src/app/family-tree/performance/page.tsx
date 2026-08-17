import { requireFamilyTreeTier } from "@/lib/family-tree/access";
import { createClient } from "@/lib/supabase/server";
import PerformanceClient from "./PerformanceClient";

export default async function FamilyTreePerformancePage() {
  const profile = await requireFamilyTreeTier("elite");
  const supabase = await createClient();

  const [{ data: birds }, { data: flyLog }] = await Promise.all([
    supabase.from("family_tree_birds").select("id, name, ring_number").eq("owner_id", profile.id).order("created_at", { ascending: false }),
    supabase
      .from("family_tree_fly_log")
      .select("id, bird_id, logged_at, depth, frequency, kit_behavior, notes")
      .eq("owner_id", profile.id)
      .order("logged_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2DD4BF", marginBottom: 12 }}>Page 3 — Performance</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#E8EDF3", marginBottom: 8 }}>Performance</h1>
        <p style={{ fontSize: 14, color: "#8B96A5", maxWidth: 640 }}>
          Casual fly notes — depth, frequency, kit behavior — tied to each bird, season over season.
        </p>
      </div>

      <PerformanceClient ownerId={profile.id} birds={birds ?? []} initialFlyLog={flyLog ?? []} />
    </div>
  );
}
