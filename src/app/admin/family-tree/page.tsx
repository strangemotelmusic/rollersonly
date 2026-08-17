import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import FamilyTreeAdminClient from "./FamilyTreeAdminClient";

export default async function AdminFamilyTreePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const [birdsRes, seasonsRes, pairsRes, flyLogRes] = await Promise.all([
    admin
      .from("family_tree_birds")
      .select("id, owner_id, name, ring_number, sex, color, birth_year, sire_id, dam_id, created_at")
      .order("created_at", { ascending: false }),
    admin.from("family_tree_seasons").select("*", { count: "exact", head: true }),
    admin
      .from("family_tree_pairs")
      .select("id, season_id, owner_id, sire_id, dam_id, paired_at, egg_count, hatched_count, status, created_at")
      .order("created_at", { ascending: false }),
    admin.from("family_tree_fly_log").select("*", { count: "exact", head: true }),
  ]);

  const birds = birdsRes.data ?? [];
  const pairs = pairsRes.data ?? [];
  const seasonsCount = seasonsRes.count ?? 0;
  const flyLogCount = flyLogRes.count ?? 0;

  const ownerIds = Array.from(new Set([...birds.map((b) => b.owner_id), ...pairs.map((p) => p.owner_id)]));
  const { data: owners } = ownerIds.length
    ? await admin.from("profiles").select("id, username, full_name, tier").in("id", ownerIds)
    : { data: [] as { id: string; username: string; full_name: string | null; tier: string }[] };

  const { data: seasons } = await admin.from("family_tree_seasons").select("id, label");

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));
  const birdNameMap = new Map(birds.map((b) => [b.id, b.name || b.ring_number || "Unnamed"]));
  const seasonLabelMap = new Map((seasons ?? []).map((s) => [s.id, s.label]));

  const uniqueBreeders = new Set(birds.map((b) => b.owner_id)).size;
  const tierCounts = { fancier: 0, breeder: 0, elite: 0, other: 0 };
  const seenOwners = new Set<string>();
  for (const b of birds) {
    if (seenOwners.has(b.owner_id)) continue;
    seenOwners.add(b.owner_id);
    const tier = ownerMap.get(b.owner_id)?.tier;
    if (tier === "fancier" || tier === "breeder" || tier === "elite") tierCounts[tier] += 1;
    else tierCounts.other += 1;
  }

  const birdRows = birds.map((b) => ({
    id: b.id,
    name: b.name,
    ringNumber: b.ring_number,
    sex: b.sex,
    color: b.color,
    birthYear: b.birth_year,
    createdAt: b.created_at,
    ownerName: ownerMap.get(b.owner_id)?.full_name || ownerMap.get(b.owner_id)?.username || "Unknown",
    sireName: b.sire_id ? birdNameMap.get(b.sire_id) ?? "—" : "—",
    damName: b.dam_id ? birdNameMap.get(b.dam_id) ?? "—" : "—",
  }));

  const pairRows = pairs.map((p) => ({
    id: p.id,
    seasonLabel: seasonLabelMap.get(p.season_id) ?? "—",
    ownerName: ownerMap.get(p.owner_id)?.full_name || ownerMap.get(p.owner_id)?.username || "Unknown",
    sireName: birdNameMap.get(p.sire_id) ?? "—",
    damName: birdNameMap.get(p.dam_id) ?? "—",
    pairedAt: p.paired_at,
    eggCount: p.egg_count,
    hatchedCount: p.hatched_count,
    status: p.status,
  }));

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Manage Family Tree
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Stats and cross-user oversight for the Family Tree product — registered birds, breeding pairs, and fly log
            activity across every loft.
          </p>

          <FamilyTreeAdminClient
            stats={{
              totalBirds: birds.length,
              uniqueBreeders,
              totalSeasons: seasonsCount,
              totalPairs: pairs.length,
              totalFlyLog: flyLogCount,
              tierCounts,
            }}
            initialBirds={birdRows}
            initialPairs={pairRows}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
