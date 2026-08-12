"use client";

import { useState } from "react";
import { reviewCertification } from "@/app/actions/certification";

export default function ReviewActions({ birdId }: { birdId: string }) {
  const [pending, setPending] = useState<"approve" | "deny" | null>(null);
  const [done, setDone] = useState<"certified" | "denied" | null>(null);

  async function handle(approve: boolean) {
    setPending(approve ? "approve" : "deny");
    const result = await reviewCertification(birdId, approve);
    setPending(null);
    if (!result.error) setDone(approve ? "certified" : "denied");
  }

  if (done) {
    return <p style={{ fontSize: 13, color: "var(--gold)" }}>{done === "certified" ? "Certified." : "Denied."}</p>;
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <button className="btn-gold" style={{ padding: "8px 18px" }} disabled={pending !== null} onClick={() => handle(true)}>
        {pending === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        style={{ padding: "8px 18px", background: "transparent", border: "0.5px solid var(--border)", color: "var(--muted)", borderRadius: 2, cursor: "pointer" }}
        disabled={pending !== null}
        onClick={() => handle(false)}
      >
        {pending === "deny" ? "Denying…" : "Deny"}
      </button>
    </div>
  );
}
