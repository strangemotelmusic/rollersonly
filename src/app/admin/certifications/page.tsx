import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCertificationEligibility } from "@/lib/certification";
import ReviewActions from "./ReviewActions";

export default async function AdminCertificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: pending } = await admin
    .from("birds")
    .select("id, name, ring_number, certification_requested_at, profiles!birds_owner_id_fkey(username, full_name)")
    .eq("certification_status", "pending")
    .order("certification_requested_at", { ascending: true });

  const withEligibility = await Promise.all(
    (pending ?? []).map(async (bird) => ({
      bird,
      eligibility: await getCertificationEligibility(bird.id),
    }))
  );

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Certification Review
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>Pending Rollers Only Certified requests.</p>

          {withEligibility.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>No pending requests.</p>
          ) : (
            withEligibility.map(({ bird, eligibility }) => (
              <div key={bird.id} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 24, marginBottom: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 18, color: "var(--white)" }}>{bird.name || "Unnamed bird"}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {bird.profiles?.full_name || bird.profiles?.username || "Unknown owner"} · Ring: {bird.ring_number || "—"}
                  </div>
                </div>
                <ul style={{ fontSize: 13, marginBottom: 20, paddingLeft: 18, listStyle: "none" }}>
                  {eligibility.criteria.map((c) => (
                    <li key={c.key} style={{ color: c.met ? "var(--gold)" : "var(--muted)", marginBottom: 4 }}>
                      {c.met ? "✓" : "✗"} {c.label}: {c.value} / {c.required}
                    </li>
                  ))}
                </ul>
                <ReviewActions birdId={bird.id} />
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
