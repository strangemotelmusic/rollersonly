import { requireFamilyTreeTier } from "@/lib/family-tree/access";
import { createClient } from "@/lib/supabase/server";
import { asPhotoSettingsMap } from "@/lib/our-breeders/crop";
import RegistryClient, { type FamilyTreeBird } from "./RegistryClient";

export default async function FamilyTreeRegistryPage() {
  const profile = await requireFamilyTreeTier("fancier");
  const supabase = await createClient();

  const { data: myBirds } = await supabase
    .from("family_tree_birds")
    .select("id, name, ring_number, sex, color, birth_year, primary_photo_url, photo_settings, sire_id, dam_id")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2DD4BF", marginBottom: 12 }}>Page 1 — Registry</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#E8EDF3", marginBottom: 8 }}>Registry</h1>
        <p style={{ fontSize: 14, color: "#8B96A5", maxWidth: 640 }}>
          Search the full registry, register your own birds, build their pedigree trees, and share any tree as a PDF,
          by email, or to another subscriber.
        </p>
      </div>

      <RegistryClient
        ownerId={profile.id}
        initialMyBirds={(myBirds ?? []).map((b) => ({ ...b, photo_settings: asPhotoSettingsMap(b.photo_settings) })) as FamilyTreeBird[]}
      />
    </div>
  );
}
