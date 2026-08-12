"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCertificationEligibility } from "@/lib/certification";

export async function requestCertification(birdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const admin = createAdminClient();
  const { data: bird } = await admin
    .from("birds")
    .select("id, owner_id, certification_status")
    .eq("id", birdId)
    .maybeSingle();

  if (!bird || bird.owner_id !== user.id) {
    return { error: "You don't own this bird." };
  }
  if (bird.certification_status === "certified") {
    return { error: "This bird is already certified." };
  }
  if (bird.certification_status === "pending") {
    return { error: "A certification request is already pending review." };
  }

  const eligibility = await getCertificationEligibility(birdId);
  if (!eligibility.eligible) {
    return { error: "This bird doesn't meet certification criteria yet.", eligibility };
  }

  await admin
    .from("birds")
    .update({ certification_status: "pending", certification_requested_at: new Date().toISOString() })
    .eq("id", birdId);

  return { ok: true };
}

export async function reviewCertification(birdId: string, approve: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) {
    return { error: "Admins only." };
  }

  await admin
    .from("birds")
    .update({
      certification_status: approve ? "certified" : "denied",
      certified_at: approve ? new Date().toISOString() : null,
    })
    .eq("id", birdId);

  return { ok: true };
}
