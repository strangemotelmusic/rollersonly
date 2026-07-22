import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function MagazineIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("tier").eq("id", user.id).maybeSingle()
    : { data: null };

  const isPaid = profile?.tier === "fancier" || profile?.tier === "breeder" || profile?.tier === "elite";

  if (!isPaid) {
    return (
      <>
        <Nav active="/magazine" />
        <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)" }}>Members-only content</div>
          <Link href="/magazine" className="btn-gold" style={{ padding: "12px 28px" }}>Back to Decade of the Spinner</Link>
        </div>
        <Footer />
      </>
    );
  }

  const { data: issue } = await supabase
    .from("magazine_issues")
    .select("id, issue_number, title, description, cover_image_url, content, published_at")
    .eq("id", id)
    .maybeSingle();

  if (!issue) {
    return (
      <>
        <Nav active="/magazine" />
        <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          Issue not found.
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav active="/magazine" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 32px" }}>
          <Link href="/magazine" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>← All issues</Link>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", margin: "24px 0 8px" }}>Issue #{issue.issue_number}</div>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>{issue.title}</h1>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 32 }}>
            {new Date(issue.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          {issue.cover_image_url && (
            <div style={{ position: "relative", height: 400, marginBottom: 32, borderRadius: 2, overflow: "hidden" }}>
              <Image src={issue.cover_image_url} alt={issue.title} fill style={{ objectFit: "cover" }} />
            </div>
          )}
          <div style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{issue.content}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}
