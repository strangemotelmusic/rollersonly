import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

export default async function MagazinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await ensureProfile(user) : null;

  const isPaid = profile?.tier === "fancier" || profile?.tier === "breeder" || profile?.tier === "elite";

  const { data: issues } = isPaid
    ? await supabase.from("magazine_issues").select("id, issue_number, title, description, cover_image_url, published_at").order("issue_number", { ascending: false })
    : { data: null };

  return (
    <>
      <Nav active="/magazine" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>Member Publication</p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,56px)", fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>
            Decade of the <em style={{ color: "var(--gold)" }}>Spinner</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
            Ten years of roller pigeon breeding, competition, and bloodline history — free with any paid RollersOnly membership.
          </p>

          {!isPaid ? (
            <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: "48px 40px", textAlign: "center", maxWidth: 520 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>★</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>Members-only content</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
                Decade of the Spinner is included with the Fancier, Breeder, and Elite Loft plans. Browse Only members don&apos;t have access.
              </p>
              <Link href="/signup" className="btn-gold" style={{ padding: "12px 28px" }}>Upgrade your plan →</Link>
            </div>
          ) : !issues || issues.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>No issues published yet — check back soon.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {issues.map((issue) => (
                <Link key={issue.id} href={`/magazine/${issue.id}`} style={{ textDecoration: "none", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden", display: "block" }}>
                  <div style={{ position: "relative", height: 280, background: "var(--void)" }}>
                    {issue.cover_image_url && <Image src={issue.cover_image_url} alt={issue.title} fill style={{ objectFit: "cover" }} />}
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>Issue #{issue.issue_number}</div>
                    <div style={{ fontSize: 16, color: "var(--white)", marginBottom: 6 }}>{issue.title}</div>
                    {issue.description && <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{issue.description}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
