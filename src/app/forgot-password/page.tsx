"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  const inputStyle = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: "var(--radius-sm)", outline: "none", fontFamily: "var(--ff-body)" };
  const labelStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: 8 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--black)", alignItems: "center", justifyContent: "center" }}>
      <div className="rs-pad-xl" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <Link href="/" style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 600, letterSpacing: "0.12em", color: "var(--white)", textDecoration: "none", display: "block", marginBottom: 40, textAlign: "center" }}>
          Rollers<span style={{ color: "var(--gold)" }}>Only</span>
        </Link>

        {!sent ? (
          <>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Reset your password</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>
              Enter the email on your account and we&apos;ll send you a link to set a new password.
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="james@andersonloft.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && <div style={{ color: "#E74C3C", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: "var(--radius-sm)", border: "0.5px solid rgba(231,76,60,0.3)" }}>{error}</div>}

            <button className="btn-gold-lg" onClick={handleSubmit} disabled={loading || !email} style={{ width: "100%", textAlign: "center" }}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              If an account exists for <strong style={{ color: "var(--white)" }}>{email}</strong>, a password reset link is on its way. Click it to choose a new password.
            </div>
          </>
        )}

        <div style={{ marginTop: 32, paddingTop: 32, borderTop: "0.5px solid var(--border)", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          <Link href="/signin" style={{ color: "var(--gold)", textDecoration: "none" }}>← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
