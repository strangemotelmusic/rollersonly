import { createAdminClient } from "@/lib/supabase/admin";

// Tune these to adjust what "Rollers Only Certified" actually requires.
// All four must be met - certification is a checklist, not a blended score,
// so buyers can see exactly why a bird qualified.
export const CERTIFICATION_THRESHOLDS = {
  minYearsFlown: 2,
  minVerifiedResults: 3,
  minTopPlacements: 1,
  minProvenOffspring: 1,
};

export type CertificationCriterion = {
  key: string;
  label: string;
  value: number;
  required: number;
  met: boolean;
};

export type CertificationEligibility = {
  eligible: boolean;
  criteria: CertificationCriterion[];
};

// Only ever reads bird_results rows with verified=true - a bird's own
// self-entered fly_score/kit_score fields are never trusted for this,
// same reasoning as tier never being trusted from user_metadata. Uses the
// admin client because bird_results has no public SELECT policy - the
// RLS-scoped client would silently see zero rows and every bird would look
// ineligible regardless of its actual record.
export async function getCertificationEligibility(birdId: string): Promise<CertificationEligibility> {
  const supabase = createAdminClient();
  const { data: resultsData } = await supabase
    .from("bird_results")
    .select("competition_date, placement")
    .eq("bird_id", birdId)
    .eq("verified", true);

  const results = resultsData ?? [];
  const years = new Set(
    results
      .map((r) => (r.competition_date ? new Date(r.competition_date).getFullYear() : null))
      .filter((y): y is number => y !== null)
  );
  const topPlacements = results.filter((r) => r.placement != null && r.placement <= 3).length;

  const { data: offspring } = await supabase
    .from("birds")
    .select("id")
    .or(`sire_id.eq.${birdId},dam_id.eq.${birdId}`);

  let provenOffspring = 0;
  if (offspring && offspring.length > 0) {
    const { data: offspringResults } = await supabase
      .from("bird_results")
      .select("bird_id")
      .in("bird_id", offspring.map((o) => o.id))
      .eq("verified", true);
    provenOffspring = new Set((offspringResults ?? []).map((r) => r.bird_id)).size;
  }

  const criteria: CertificationCriterion[] = [
    {
      key: "yearsFlown",
      label: "Years flown in the kit",
      value: years.size,
      required: CERTIFICATION_THRESHOLDS.minYearsFlown,
      met: years.size >= CERTIFICATION_THRESHOLDS.minYearsFlown,
    },
    {
      key: "verifiedResults",
      label: "Verified competition results",
      value: results.length,
      required: CERTIFICATION_THRESHOLDS.minVerifiedResults,
      met: results.length >= CERTIFICATION_THRESHOLDS.minVerifiedResults,
    },
    {
      key: "topPlacements",
      label: "Top-3 finishes",
      value: topPlacements,
      required: CERTIFICATION_THRESHOLDS.minTopPlacements,
      met: topPlacements >= CERTIFICATION_THRESHOLDS.minTopPlacements,
    },
    {
      key: "provenOffspring",
      label: "Proven offspring in competition",
      value: provenOffspring,
      required: CERTIFICATION_THRESHOLDS.minProvenOffspring,
      met: provenOffspring >= CERTIFICATION_THRESHOLDS.minProvenOffspring,
    },
  ];

  return { eligible: criteria.every((c) => c.met), criteria };
}
