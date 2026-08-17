import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { buildAncestorEmbedFields, type PedigreeNode } from "@/lib/pedigree/tree";
import PedigreeClient from "./PedigreeClient";

const FEATURED_GENERATIONS = 4;

export default async function PedigreePage() {
  const supabase = await createClient();

  const [{ count: birdsRegistered }, { count: lofts }, { count: pedigreeConnections }, { count: certifiedBirds }] = await Promise.all([
    supabase.from("birds").select("*", { count: "exact", head: true }),
    supabase.from("lofts").select("*", { count: "exact", head: true }),
    supabase.from("birds").select("*", { count: "exact", head: true }).or("sire_id.not.is.null,dam_id.not.is.null"),
    supabase.from("birds").select("*", { count: "exact", head: true }).eq("certification_status", "certified"),
  ]);

  const { data: recentRaw } = await supabase
    .from("birds")
    .select("id, name, ring_number, birth_year, sex, health_certified, dna_certified, certification_status, lofts(name)")
    .order("created_at", { ascending: false })
    .limit(8);

  const recentBirds = (recentRaw ?? []).map((b) => ({
    id: b.id,
    name: b.name || "Unnamed bird",
    ring: b.ring_number,
    loft: b.lofts?.name || "Independent",
    year: b.birth_year,
    certs: [
      b.certification_status === "certified" && "RollersOnly Certified",
      b.dna_certified && "DNA Cert",
      b.health_certified && "Health Cert",
    ].filter((c): c is string => Boolean(c)),
  }));

  const { data: bloodlineLoftsRaw } = await supabase
    .from("lofts")
    .select("name")
    .order("total_birds_sold", { ascending: false, nullsFirst: false })
    .limit(6);
  const bloodlineLofts = (bloodlineLoftsRaw ?? []).map((l) => l.name);

  const { data: featuredRaw } = await supabase
    .from("birds")
    .select(`${buildAncestorEmbedFields(FEATURED_GENERATIONS)}, id, name, ring_number, sex, color, primary_photo_url, sire_id, dam_id, lofts(name)`)
    .or("sire_id.not.is.null,dam_id.not.is.null")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const featuredBird = featuredRaw
    ? { root: featuredRaw as unknown as PedigreeNode, loftName: (featuredRaw as { lofts?: { name: string } | null }).lofts?.name ?? null }
    : null;

  return (
    <>
      <Nav active="/pedigree" />
      <PedigreeClient
        stats={{
          registered: birdsRegistered ?? 0,
          lofts: lofts ?? 0,
          connections: pedigreeConnections ?? 0,
          certified: certifiedBirds ?? 0,
        }}
        recentBirds={recentBirds}
        bloodlineLofts={bloodlineLofts}
        featuredBird={featuredBird}
      />
      <Footer />
    </>
  );
}
