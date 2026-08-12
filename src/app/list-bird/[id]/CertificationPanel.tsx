"use client";

import { useState } from "react";
import { requestCertification } from "@/app/actions/certification";
import type { CertificationEligibility } from "@/lib/certification";

export default function CertificationPanel({
  birdId,
  status,
  initialEligibility,
}: {
  birdId: string;
  status: string;
  initialEligibility: CertificationEligibility;
}) {
  const [eligibility, setEligibility] = useState(initialEligibility);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setPending(true);
    setError(null);
    const result = await requestCertification(birdId);
    setPending(false);

    if (result.error) {
      setError(result.error);
      if (result.eligibility) setEligibility(result.eligibility);
      return;
    }
    setCurrentStatus("pending");
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 24, marginTop: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
        Rollers Only Certified
      </div>

      {currentStatus === "certified" && (
        <p style={{ fontSize: 14, color: "var(--white)" }}>★ This bird is Rollers Only Certified.</p>
      )}
      {currentStatus === "pending" && (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Your certification request is pending review.</p>
      )}
      {currentStatus === "denied" && (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Your last certification request wasn&apos;t approved. You can request again once the bird&apos;s record improves.</p>
      )}
      {(currentStatus === "none" || currentStatus === "denied") && (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>
            Certification is based on verified competition results only — years flown, in-air placements, and how well
            this bird&apos;s offspring have performed.
          </p>
          <ul style={{ fontSize: 13, marginBottom: 20, paddingLeft: 18, listStyle: "none" }}>
            {eligibility.criteria.map((c) => (
              <li key={c.key} style={{ color: c.met ? "var(--gold)" : "var(--muted)", marginBottom: 6 }}>
                {c.met ? "✓" : "○"} {c.label}: {c.value} / {c.required}
              </li>
            ))}
          </ul>
          {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginBottom: 12 }}>{error}</p>}
          <button
            className="btn-gold"
            style={{ padding: "10px 22px", opacity: eligibility.eligible ? 1 : 0.5, cursor: eligibility.eligible ? "pointer" : "not-allowed" }}
            disabled={!eligibility.eligible || pending}
            onClick={handleRequest}
          >
            {pending ? "Submitting…" : "Request Certification"}
          </button>
        </>
      )}
    </div>
  );
}
