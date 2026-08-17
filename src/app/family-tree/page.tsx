import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TIER_LABEL: Record<string, string> = { fancier: "Fancier", breeder: "Breeder", elite: "Elite" };

const PILLARS = [
  { num: "01", title: "Registry", desc: "Register every bird you keep — not just the ones for sale. Build a real, verifiable sire/dam bloodline chain for each one.", tier: "fancier" },
  { num: "02", title: "Trees & Sharing", desc: "View a multi-generation family tree for any bird, export it as a clean PDF, email it, or send it to another subscriber in seconds.", tier: "fancier" },
  { num: "03", title: "Breeding Manager", desc: "Organize breeding seasons and pairs, track eggs and hatches — with a live shared-ancestor warning that flags inbreeding risk before you pair two birds. RollerDB doesn't do this.", tier: "breeder" },
  { num: "04", title: "Performance Log", desc: "Casual day-to-day fly notes — depth, frequency, kit behavior — tied to each bird, season over season.", tier: "elite" },
];

const PLANS = [
  { id: "fancier", name: "Fancier", price: 19, unlocks: "Registry — register birds, build & share pedigree trees" },
  { id: "breeder", name: "Breeder", price: 49, unlocks: "Everything in Fancier + Breeding Manager", popular: true },
  { id: "elite", name: "Elite", price: 149, unlocks: "Everything in Breeder + Performance Log" },
];

export default async function FamilyTreeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const { upgrade } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ count: birdsTracked }, { count: seasonsRun }] = await Promise.all([
    admin.from("family_tree_birds").select("*", { count: "exact", head: true }),
    admin.from("family_tree_seasons").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      {upgrade && (
        <div
          style={{
            background: "#14201E",
            border: "1px solid #1C3D3A",
            borderRadius: 6,
            padding: "16px 20px",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "#C7D0DB" }}>
            {user
              ? `That page needs the ${TIER_LABEL[upgrade] || upgrade} plan or higher.`
              : `Sign in and subscribe to ${TIER_LABEL[upgrade] || upgrade} to unlock that page.`}
          </span>
          <Link
            href={user ? "/dashboard" : "/signup"}
            style={{ background: "#2DD4BF", color: "#0A0D12", fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 4, textDecoration: "none" }}
          >
            {user ? "Upgrade Plan" : "Get Started"}
          </Link>
        </div>
      )}

      <div style={{ maxWidth: 720, marginBottom: 56 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2DD4BF", marginBottom: 16 }}>
          Pedigree &amp; Breeding Software
        </p>
        <h1 style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 800, lineHeight: 1.08, color: "#E8EDF3", marginBottom: 20, letterSpacing: "-0.01em" }}>
          Your bloodlines, tracked properly.
        </h1>
        <p style={{ fontSize: 15, color: "#8B96A5", lineHeight: 1.7 }}>
          Family Tree is a dedicated pedigree and breeding tool for Birmingham Roller fanciers — register birds,
          build real multi-generation trees, catch inbreeding before it happens, and manage your seasons. Built for
          people who take their bloodlines seriously, whether or not you ever sell a bird.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#1C232E", border: "1px solid #1C232E", borderRadius: 6, overflow: "hidden", marginBottom: 64 }}>
        {[[String(birdsTracked ?? 0), "Birds tracked"], [String(seasonsRun ?? 0), "Breeding seasons"], ["4", "Generations deep"], ["100%", "Independent of listings"]].map(([val, label]) => (
          <div key={label} style={{ background: "#0D1117", padding: "24px 20px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#E8EDF3", lineHeight: 1, marginBottom: 6 }}>{val}</div>
            <div style={{ fontSize: 11, color: "#5B6675", letterSpacing: "0.04em" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#E8EDF3", marginBottom: 24 }}>What you get</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {PILLARS.map((p) => (
            <div key={p.num} style={{ background: "#0D1117", border: "1px solid #1C232E", borderRadius: 6, padding: 24 }}>
              <div style={{ fontSize: 11, color: "#2DD4BF", fontWeight: 700, marginBottom: 10 }}>{p.num}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E8EDF3", marginBottom: 8 }}>{p.title}</div>
              <p style={{ fontSize: 13, color: "#8B96A5", lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#E8EDF3", marginBottom: 8 }}>Plans</h2>
        <p style={{ fontSize: 13, color: "#5B6675", marginBottom: 24 }}>
          Family Tree access comes with your existing RollersOnly subscription — no separate signup.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "#0D1117",
                border: plan.popular ? "1px solid #2DD4BF" : "1px solid #1C232E",
                borderRadius: 6,
                padding: 28,
                position: "relative",
              }}
            >
              {plan.popular && (
                <span style={{ position: "absolute", top: -10, left: 24, background: "#2DD4BF", color: "#0A0D12", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  MOST POPULAR
                </span>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E8EDF3", marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#E8EDF3", marginBottom: 12 }}>
                ${plan.price}
                <span style={{ fontSize: 13, color: "#5B6675", fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: 13, color: "#8B96A5", lineHeight: 1.6, marginBottom: 20 }}>{plan.unlocks}</p>
              <Link
                href={user ? "/dashboard" : "/signup"}
                style={{ display: "block", textAlign: "center", padding: 12, background: plan.popular ? "#2DD4BF" : "transparent", border: plan.popular ? "none" : "1px solid #1C232E", color: plan.popular ? "#0A0D12" : "#E8EDF3", fontSize: 13, fontWeight: 700, borderRadius: 4, textDecoration: "none" }}
              >
                {user ? "Manage Plan" : "Get Started"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
