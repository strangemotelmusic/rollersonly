import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function ownerLabel(owner: { username: string; full_name: string | null } | null) {
  if (!owner) return "Unknown";
  return owner.full_name || owner.username;
}

export default async function AdminMatchmakingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: reservations } = await admin
    .from("matchmaking_reservations")
    .select(
      `id, deposit_status, deposit_amount_cents, customer_email, created_at,
       requester:profiles!matchmaking_reservations_requester_id_fkey(username, full_name),
       sire:birds!matchmaking_reservations_sire_bird_id_fkey(name),
       dam:birds!matchmaking_reservations_dam_bird_id_fkey(name),
       sire_owner:profiles!matchmaking_reservations_sire_owner_id_fkey(username, full_name),
       dam_owner:profiles!matchmaking_reservations_dam_owner_id_fkey(username, full_name)`
    )
    .order("created_at", { ascending: false });

  const statusColor: Record<string, string> = {
    pending: "var(--muted)",
    paid: "var(--gold)",
    refunded: "#ff6666",
    cancelled: "#ff6666",
  };

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Matchmaking Reservations
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Every pairing deposit paid through /matchmaking, most recent first.
          </p>

          {!reservations || reservations.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>No reservations yet.</p>
          ) : (
            reservations.map((r) => (
              <div key={r.id} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ fontSize: 18, color: "var(--white)" }}>
                    {r.sire?.name ?? "Unknown sire"} <span style={{ color: "var(--muted)" }}>×</span> {r.dam?.name ?? "Unknown dam"}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor[r.deposit_status] ?? "var(--muted)" }}>
                    {r.deposit_status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                  <div>Requester: {ownerLabel(r.requester)} {r.customer_email && `(${r.customer_email})`}</div>
                  <div>Sire owner: {ownerLabel(r.sire_owner)}</div>
                  <div>Dam owner: {ownerLabel(r.dam_owner)}</div>
                  <div>Deposit: ${(r.deposit_amount_cents / 100).toFixed(2)}</div>
                  <div>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
