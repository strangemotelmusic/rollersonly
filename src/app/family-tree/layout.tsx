import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tierRank } from "@/lib/family-tree/access";

const NAV_ITEMS = [
  { label: "Registry", href: "/family-tree/registry", minTier: "fancier" as const },
  { label: "Breeding", href: "/family-tree/breeding", minTier: "breeder" as const },
  { label: "Performance", href: "/family-tree/performance", minTier: "elite" as const },
];

export default async function FamilyTreeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tier = "browse";
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("tier, is_admin").eq("id", user.id).maybeSingle();
    tier = profile?.tier ?? "browse";
    isAdmin = Boolean(profile?.is_admin);
  }
  const rank = tierRank(tier);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0D12", fontFamily: "var(--ff-body)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#0D1117",
          borderBottom: "1px solid #1C232E",
          padding: "0 32px",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link href="/family-tree" style={{ textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#E8EDF3", letterSpacing: "0.02em" }}>
                Family<span style={{ color: "#2DD4BF" }}>Tree</span>
              </span>
              <span style={{ fontSize: 9, color: "#5B6675", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
                Part of RollersOnly · Brought to you by Decade of the Spinner
              </span>
            </Link>

            <nav style={{ display: "flex", gap: 4 }}>
              {NAV_ITEMS.map((item) => {
                const locked = !isAdmin && rank < tierRank(item.minTier);
                return (
                  <Link
                    key={item.href}
                    href={locked ? `/family-tree?upgrade=${item.minTier}` : item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 4,
                      fontSize: 13,
                      color: locked ? "#5B6675" : "#C7D0DB",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                    {locked && <span style={{ fontSize: 11 }}>🔒</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isAdmin ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#0A0D12",
                  background: "#2DD4BF",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                Owner · Full Access
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#2DD4BF",
                  border: "1px solid #1C3D3A",
                  background: "#0F1F1D",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                {tier === "browse" ? "Free" : tier}
              </span>
            )}
            <Link href="/" style={{ fontSize: 12, color: "#5B6675", textDecoration: "none" }}>
              ← RollersOnly
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>{children}</main>
    </div>
  );
}
