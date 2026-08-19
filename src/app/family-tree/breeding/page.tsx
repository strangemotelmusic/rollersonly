import { requireFamilyTreeAccess } from "@/lib/family-tree/access";
import { createClient } from "@/lib/supabase/server";
import BreedingClient, { type Season } from "./BreedingClient";

export default async function FamilyTreeBreedingPage() {
  const profile = await requireFamilyTreeAccess();
  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("family_tree_seasons")
    .select(
      `id, label, start_date, end_date, notes,
       family_tree_pairs(id, sire_id, dam_id, paired_at, egg_count, hatched_count, status, notes,
         sire:sire_id(id, name, ring_number), dam:dam_id(id, name, ring_number))`
    )
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2DD4BF", marginBottom: 12 }}>Page 2 — Breeding</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#E8EDF3", marginBottom: 8 }}>Breeding</h1>
        <p style={{ fontSize: 14, color: "#8B96A5", maxWidth: 640 }}>
          Organize seasons and pairs, track eggs and hatches, and catch shared-ancestor risk before you commit a pair.
        </p>
      </div>

      <BreedingClient ownerId={profile.id} initialSeasons={(seasons ?? []) as unknown as Season[]} />
    </div>
  );
}
