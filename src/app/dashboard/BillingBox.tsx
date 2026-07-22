"use client";
import { useState } from "react";
import { createCheckoutSession, createPortalSession } from "@/app/actions/stripe";

const UPGRADE_TIERS = [
  { id: "fancier", name: "Fancier", price: 19 },
  { id: "breeder", name: "Breeder", price: 49 },
  { id: "elite", name: "Elite Loft", price: 149 },
];

export default function BillingBox({
  tierLabel,
  currentTier,
  hasStripeCustomer,
}: {
  tierLabel: string;
  currentTier: string;
  hasStripeCustomer: boolean;
}) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade(tierId: string) {
    setLoadingTier(tierId);
    setError("");
    const result = await createCheckoutSession(tierId);
    if (result?.error) { setLoadingTier(null); setError(result.error); }
  }

  async function handleManage() {
    setManaging(true);
    await createPortalSession();
    setManaging(false);
  }

  const upgradeOptions = UPGRADE_TIERS.filter((t) => t.id !== currentTier);

  return (
    <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: 24, borderRadius: 2 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>◆ {tierLabel}</div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Your Plan</div>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
        {currentTier === "browse"
          ? "Upgrade to bid, sell, and unlock Decade of the Spinner."
          : "Unlimited listings, verified pedigree, and priority auction placement."}
      </p>

      {error && <div style={{ color: "#E74C3C", fontSize: 12, marginBottom: 12 }}>{error}</div>}

      {hasStripeCustomer && (
        <button
          onClick={handleManage}
          disabled={managing}
          style={{ width: "100%", textAlign: "center", padding: 10, border: "0.5px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 11, borderRadius: 1, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", marginBottom: upgradeOptions.length > 0 ? 12 : 0 }}
        >
          {managing ? "Opening…" : "Manage Subscription"}
        </button>
      )}

      {upgradeOptions.map((t) => (
        <button
          key={t.id}
          onClick={() => handleUpgrade(t.id)}
          disabled={loadingTier !== null}
          className="btn-gold"
          style={{ width: "100%", textAlign: "center", marginBottom: 8, cursor: "pointer" }}
        >
          {loadingTier === t.id ? "Redirecting…" : `Upgrade to ${t.name} — $${t.price}/mo`}
        </button>
      ))}
    </div>
  );
}
