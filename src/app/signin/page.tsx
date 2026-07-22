"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const inputStyle = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none", fontFamily: "var(--ff-body)" };
  const labelStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: 8 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--black)" }}>
      {/* LEFT */}
      <div className="rs-hide-mobile" style={{ width: 480, background: "var(--void)", borderRight: "0.5px solid var(--border)", padding: "64px 48px", display: "flex", flexDirection: "column" }}>
        <Link href="/" style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 600, letterSpacing: "0.12em", color: "var(--white)", textDecoration: "none", marginBottom: 64 }}>
          Rollers<span style={{ color: "var(--gold)" }}>Only</span>
        </Link>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 40, fontWeight: 300, lineHeight: 1.1, color: "var(--white)", marginBottom: 24 }}>
          Welcome back to the <em style={{ color: "var(--gold)" }}>loft</em>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 48 }}>
          Sign in to access your birds, active bids, auction schedule, and pedigree registry.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: "auto" }}>
          {[["◆", "Verified pedigrees"],["🔒", "Escrow-protected"],["★", "Decade of the Spinner"],["✓", "Global community"]].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ color: "var(--gold)" }}>{icon}</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="rs-pad-xl" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 64 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Sign in to your loft</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
            Don&apos;t have an account? <Link href="/signup" style={{ color: "var(--gold)", textDecoration: "none" }}>Join RollersOnly →</Link>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="james@andersonloft.com" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "var(--gold)")} onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "var(--gold)")} onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
          </div>
          <div style={{ textAlign: "right", marginBottom: 32 }}>
            <a href="mailto:strangemotelmusic@gmail.com" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>Forgot password?</a>
          </div>

          {error && <div style={{ color: "#E74C3C", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: 2, border: "0.5px solid rgba(231,76,60,0.3)" }}>{error}</div>}

          <button className="btn-gold-lg" onClick={handleSignIn} disabled={loading} style={{ width: "100%", textAlign: "center" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: "0.5px solid var(--border)", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
            New to RollersOnly? <Link href="/signup" style={{ color: "var(--gold)", textDecoration: "none" }}>Create your account →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
