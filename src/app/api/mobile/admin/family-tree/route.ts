import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const [birdsRes, seasonsCountRes, pairsRes, flyLogCountRes] = await Promise.all([
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
  const seasonsCount = seasonsCountRes.count ?? 0;
  const flyLogCount = flyLogCountRes.count ?? 0;

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

  return NextResponse.json({
    stats: { totalBirds: birds.length, uniqueBreeders, totalSeasons: seasonsCount, totalPairs: pairs.length, totalFlyLog: flyLogCount, tierCounts },
    birds: birdRows,
    pairs: pairRows,
  });
}

const TABLES: Record<string, string> = {
  bird: "family_tree_birds",
  season: "family_tree_seasons",
  pair: "family_tree_pairs",
  "fly-log": "family_tree_fly_log",
};

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);
  const table = body?.type ? TABLES[body.type] : undefined;
  if (body?.action !== "delete" || !table || !body?.id) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from(table).delete().eq("id", body.id);
  if (error) {
    if (error.message.includes("foreign key")) {
      return NextResponse.json({ error: "Cannot delete — this record is referenced elsewhere. Remove dependents first." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
