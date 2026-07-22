"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession } from "@/app/actions/stripe";

const tiers = [
  { id: "browse", name: "Browse Only", price: 0, desc: "Explore listings, lofts, and pedigrees — no bidding or selling" },
  { id: "fancier", name: "Fancier", price: 19, desc: "Browse, bid, and buy with full buyer protection" },
  { id: "breeder", name: "Breeder", price: 49, desc: "List birds, build your loft profile, Decade of the Spinner included", popular: true },
  { id: "elite", name: "Elite Loft", price: 149, desc: "Featured placement, Elite badge, championship priority" },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState("breeder");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", username: "", password: "", country: "United States" });
  const [loft, setLoft] = useState({ name: "", location: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));

  async function handleSignup() {
    setLoading(true);
    setError("");
    const fullName = `${form.firstName} ${form.lastName}`;
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username, full_name: fullName, tier } },
    });
    if (err) { setLoading(false); setError(err.message); return; }

    // Only insert the profile row if signUp returned an active session — if
    // email confirmation is required, data.user exists but there's no
    // session yet, so this request is unauthenticated and RLS (auth.uid() =
    // id) will reject it. In that case the dashboard's own defensive
    // upsert-on-first-load creates the profile once the user actually
    // confirms and signs in.
    //
    // tier is always 'browse' here regardless of what was selected - only
    // the Stripe webhook ever upgrades it, once payment actually succeeds.
    // Picking a paid plan below just kicks off checkout for that plan.
    if (data.session && data.user) {
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: data.user.id,
        username: form.username,
        full_name: fullName,
        tier: "browse",
      });
      if (profileErr) { setLoading(false); setError(profileErr.message); return; }
    }

    if (tier !== "browse" && data.session) {
      const result = await createCheckoutSession(tier);
      if (result?.error) { setLoading(false); setError(result.error); return; }
      return; // createCheckoutSession redirects on success
    }

    setLoading(false);
    setStep(3);
  }

  async function handleLoftSetup() {
    if (loft.name) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const slug = loft.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await supabase.from("lofts").upsert(
          { owner_id: user.id, name: loft.name, location: loft.location, description: loft.description, slug },
          { onConflict: "slug" }
        );
      }
    }
    setStep(4);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--black)" }}>
      {/* LEFT */}
      <div className="rs-hide-mobile" style={{ width: 480, background: "var(--void)", borderRight: "0.5px solid var(--border)", padding: "64px 48px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <Link href="/" style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 600, letterSpacing: "0.12em", color: "var(--white)", textDecoration: "none", marginBottom: 64 }}>
          Rollers<span style={{ color: "var(--gold)" }}>Only</span>
        </Link>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 40, fontWeight: 300, lineHeight: 1.1, color: "var(--white)", marginBottom: 24 }}>
          Join the world&apos;s first <em style={{ color: "var(--gold)" }}>dedicated</em> roller pigeon platform
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 48 }}>
          Verified pedigrees, live auctions, escrow protection, and a global community of roller pigeon fanciers — all in one place.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { icon: "◆", title: "Verified pedigree registry", desc: "Every bird gets a locked, tamper-proof bloodline record" },
            { icon: "🔒", title: "Escrow-protected payments", desc: "Funds held until you confirm arrival and condition" },
            { icon: "★", title: "Decade of the Spinner included", desc: "Full digital access with Breeder and Elite Loft plans" },
            { icon: "✓", title: "500K+ global community", desc: "North America, Europe, Middle East, Asia-Pacific" },
          ].map((t) => (
            <div key={t.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ color: "var(--gold)", fontSize: 16, minWidth: 20, marginTop: 2 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--white)", marginBottom: 2 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="rs-pad-xl" style={{ flex: 1, padding: "64px 80px", overflowY: "auto" }}>
        {/* Step bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 48, alignItems: "center" }}>
          {["Choose plan", "Your details", "Loft setup", "Done"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, background: step > i + 1 ? "var(--gold)" : step === i + 1 ? "var(--gold)" : "var(--surface)", color: step >= i + 1 ? "var(--black)" : "var(--muted)", border: step <= i + 1 ? "0.5px solid var(--border)" : "none" }}>{step > i + 1 ? "✓" : i + 1}</div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: step === i + 1 ? "var(--white)" : "var(--muted)", whiteSpace: "nowrap" }}>{label}</div>
              </div>
              {i < 3 && <div style={{ width: 60, height: 0.5, background: step > i + 1 ? "var(--gold)" : "var(--border)", margin: "0 8px", marginBottom: 24 }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Choose your plan</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>You can upgrade or downgrade anytime from your dashboard</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {tiers.map((t) => (
                <div key={t.id} onClick={() => setTier(t.id)} style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 24px", background: tier === t.id ? "var(--surface)" : "var(--deep)", border: `0.5px solid ${tier === t.id ? "var(--gold)" : "var(--border)"}`, borderRadius: 2, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${tier === t.id ? "var(--gold)" : "var(--muted)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {tier === t.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--white)", marginBottom: 2 }}>
                      {t.name}
                      {t.popular && <span style={{ fontSize: 10, background: "var(--gold)", color: "var(--black)", padding: "2px 8px", borderRadius: 1, marginLeft: 10, fontWeight: 700 }}>Most popular</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.desc}</div>
                  </div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)" }}>
                    {t.price === 0 ? "Free" : (<>${t.price}<span style={{ fontSize: 13, color: "var(--muted)" }}>/mo</span></>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-gold-lg" onClick={() => setStep(2)}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Your details</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>Create your RollersOnly account</div>
            <div className="rs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Field label="First name" value={form.firstName} onChange={(v) => set({ firstName: v })} placeholder="James" />
              <Field label="Last name" value={form.lastName} onChange={(v) => set({ lastName: v })} placeholder="Anderson" />
            </div>
            <Field label="Email address" value={form.email} onChange={(v) => set({ email: v })} placeholder="james@andersonloft.com" type="email" />
            <div style={{ marginTop: 16 }}>
              <Field label="Username / Loft handle" value={form.username} onChange={(v) => set({ username: v })} placeholder="AndersonLoft_TX" hint="Appears on your public loft profile and auction listings" />
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Password" value={form.password} onChange={(v) => set({ password: v })} placeholder="Min. 8 characters" type="password" />
            </div>
            <div style={{ marginTop: 16, marginBottom: 24 }}>
              <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 8 }}>Country</label>
              <select value={form.country} onChange={(e) => set({ country: e.target.value })} style={{ width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none" }}>
                {["United States","Canada","United Kingdom","Netherlands","Belgium","Germany","Saudi Arabia","UAE","Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            {error && <div style={{ color: "#E74C3C", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-gold-lg" onClick={handleSignup} disabled={loading}>{loading ? "Creating account…" : "Continue →"}</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 28, fontFamily: "var(--ff-display)", fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Set up your loft</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>Your public loft profile — fanciers worldwide will see this</div>
            <Field label="Loft name" value={loft.name} onChange={(v) => setLoft((p) => ({ ...p, name: v }))} placeholder="Anderson Elite Loft" />
            <div style={{ marginTop: 16 }}>
              <Field label="Location / City" value={loft.location} onChange={(v) => setLoft((p) => ({ ...p, location: v }))} placeholder="DeSoto, Texas, USA" />
            </div>
            <div style={{ marginTop: 16, marginBottom: 24 }}>
              <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 8 }}>Brief description</label>
              <textarea value={loft.description} onChange={(e) => setLoft((p) => ({ ...p, description: e.target.value }))} placeholder="Tell the community about your loft, your bloodlines, and what you specialize in…" style={{ width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none", minHeight: 100, resize: "vertical", fontFamily: "var(--ff-body)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn-ghost" onClick={() => setStep(4)} style={{ fontSize: 12, color: "var(--muted)" }}>Skip for now →</button>
              <button className="btn-gold-lg" onClick={handleLoftSetup}>Finish setup →</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>◆</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 42, fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>You&apos;re in.</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--gold)", fontStyle: "italic", marginBottom: 24 }}>Welcome to RollersOnly.</div>
            <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 400, margin: "0 auto 40px" }}>Your account is active. Head to your dashboard to complete your loft profile and register your first bird.</p>
            <button className="btn-gold-lg" onClick={() => { router.push("/dashboard"); router.refresh(); }}>Enter Your Dashboard →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 8 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none", fontFamily: "var(--ff-body)" }} onFocus={(e) => (e.target.style.borderColor = "var(--gold)")} onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
      {hint && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
