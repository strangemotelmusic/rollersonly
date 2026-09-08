import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasMagazineAccess, excerptContent } from "@/lib/magazine";

// magazine_issues has no public/authenticated SELECT policy on purpose -
// the tier gate (breeder/elite only) is enforced here in application code
// via the admin client, mirroring src/app/magazine/page.tsx and
// src/app/magazine/[id]/page.tsx. A blanket RLS policy would let any
// authenticated mobile client bypass the paywall by querying the table
// directly, so this route stays the only path to the data.
export async function GET(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const issueId = searchParams.get("id");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("tier, is_admin").eq("id", auth.userId).maybeSingle();
  const hasAccess = hasMagazineAccess(profile?.tier, profile?.is_admin);

  if (issueId) {
    const { data: issue } = await admin
      .from("magazine_issues")
      .select("id, issue_number, title, description, cover_image_url, content, pdf_url, published_at")
      .eq("id", issueId)
      .maybeSingle();

    if (!issue) return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    if (!hasAccess) return NextResponse.json({ error: "Members-only content.", locked: true }, { status: 403 });

    return NextResponse.json({ issue, hasAccess: true });
  }

  if (hasAccess) {
    const { data: issues } = await admin
      .from("magazine_issues")
      .select("id, issue_number, title, description, cover_image_url, published_at")
      .order("issue_number", { ascending: false });

    return NextResponse.json({ hasAccess: true, issues: issues ?? [] });
  }

  const { data: latest } = await admin
    .from("magazine_issues")
    .select("id, issue_number, title, description, cover_image_url, content, published_at")
    .order("issue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return NextResponse.json({ hasAccess: false, sample: null });

  const { content, ...rest } = latest;
  return NextResponse.json({ hasAccess: false, sample: { ...rest, excerpt: excerptContent(content) } });
}
