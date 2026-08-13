import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { hasMagazineAccess, excerptContent } from "@/lib/magazine";

export default async function MagazinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await ensureProfile(user) : null;
  const hasAccess = hasMagazineAccess(profile?.tier);

  // magazine_issues has no public RLS policy on purpose (full content is
  // paywalled), so every read goes through the admin client - the tier
  // check above decides what actually reaches the page, not the database.
  const admin = createAdminClient();

  if (hasAccess) {
    const { data: issues } = await admin
      .from("magazine_issues")
      .select("id, issue_number, title, description, cover_image_url, published_at")
      .order("issue_number", { ascending: false });

    return (
      <>
        <Nav active="/magazine" />
        <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
              Member Publication
            </p>
            <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,56px)", fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>
              Decade of the <em style={{ color: "var(--gold)" }}>Spinner</em>
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
              Ten years of roller pigeon breeding, competition, and bloodline history — included with your Breeder or
              Elite Loft membership.
            </p>

            {!issues || issues.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--muted)" }}>No issues published yet — check back soon.</p>
            ) : (
              <div className="rs-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                {issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/magazine/${issue.id}`}
                    style={{ textDecoration: "none", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden", display: "block" }}
                  >
                    <div style={{ position: "relative", height: 280, background: "var(--void)" }}>
                      {issue.cover_image_url && <Image src={issue.cover_image_url} alt={issue.title} fill style={{ objectFit: "cover" }} />}
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
                        Issue #{issue.issue_number}
                      </div>
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

  // Not a Breeder/Elite subscriber — show a free sample of the latest issue.
  const { data: latest } = await admin
    .from("magazine_issues")
    .select("id, issue_number, title, description, cover_image_url, content, published_at")
    .order("issue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sample = latest ? excerptContent(latest.content) : null;

  return (
    <>
      <Nav active="/magazine" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
            Member Publication
          </p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,56px)", fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>
            Decade of the <em style={{ color: "var(--gold)" }}>Spinner</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 48 }}>
            Ten years of roller pigeon breeding, competition, and bloodline history — free to sample, full issues
            included with the Breeder and Elite Loft plans.
          </p>

          {!latest ? (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>No issues published yet — check back soon.</p>
          ) : (
            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden" }}>
              {latest.cover_image_url && (
                <div style={{ position: "relative", height: 320 }}>
                  <Image src={latest.cover_image_url} alt={latest.title} fill style={{ objectFit: "cover" }} />
                </div>
              )}
              <div style={{ padding: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
                  Sample — Issue #{latest.issue_number}
                </div>
                <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>
                  {latest.title}
                </h2>
                {sample?.text && (
                  <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.9, whiteSpace: "pre-wrap", marginBottom: sample.truncated ? 8 : 0 }}>
                    {sample.text}
                    {sample.truncated && "…"}
                  </p>
                )}
                {sample?.truncated && (
                  <div style={{ marginTop: 28, paddingTop: 24, borderTop: "0.5px solid var(--border)", textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                      Subscribe to Breeder or Elite Loft to keep reading this issue and every issue in the archive.
                    </p>
                    <Link href="/signup" className="btn-gold" style={{ padding: "12px 28px" }}>
                      Upgrade your plan →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
