"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

export default function NewsletterSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const result = await subscribeToNewsletter(email);
    if ("error" in result) {
      setError(result.error);
      setStatus("idle");
      return;
    }
    setStatus("done");
    setEmail("");
  }

  if (status === "done") {
    return <p className="footer-newsletter-done">You&apos;re on the list.</p>;
  }

  return (
    <form className="footer-newsletter-form" onSubmit={handleSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="footer-newsletter-input"
      />
      <button type="submit" className="footer-newsletter-btn" disabled={status === "saving"}>
        {status === "saving" ? "…" : "Subscribe"}
      </button>
      {error && <p className="footer-newsletter-error">{error}</p>}
    </form>
  );
}
