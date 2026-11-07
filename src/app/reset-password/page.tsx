"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link redirects here with a `?code=` param; the browser
    // client exchanges it for a session automatically on load and fires
    // this event once that session is in place.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit() {
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1500);
  }

  const inputStyle = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: "var(--radius-sm)", outline: "none", fontFamily: "var(--ff-body)" };
  const labelStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: 8 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--black)", alignItems: "center", justifyContent: "center" }}>
      <div className="rs-pad-xl" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <Link href="/" style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 600, letterSpacing: "0.12em", color: "var(--white)", textDecoration: "none", display: "block", marginBottom: 40, textAlign: "center" }}>
          Rollers<span style={{ color: "var(--gold)" }}>Only</span>
        </Link>

        {done ? (
          <>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Password updated</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Taking you to your dashboard…</div>
          </>
        ) : !ready ? (
          <>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Verifying link…</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              If this takes more than a few seconds, the link may have expired. <Link href="/forgot-password" style={{ color: "var(--gold)", textDecoration: "none" }}>Request a new one →</Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Set a new password</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>Choose a new password for your account.</div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype your new password"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && <div style={{ color: "#E74C3C", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: "var(--radius-sm)", border: "0.5px solid rgba(231,76,60,0.3)" }}>{error}</div>}

            <button className="btn-gold-lg" onClick={handleSubmit} disabled={loading} style={{ width: "100%", textAlign: "center" }}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
