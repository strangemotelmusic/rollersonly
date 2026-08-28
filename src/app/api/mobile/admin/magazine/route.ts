import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import type { Database } from "@/lib/supabase/database.types";

type IssueUpdate = Database["public"]["Tables"]["magazine_issues"]["Update"];

const PHOTO_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/magazine-covers/`;
const PDF_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/magazine-pdfs/`;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const { data } = await admin
    .from("magazine_issues")
    .select("id, issue_number, title, description, content, cover_image_url, pdf_url, published_at")
    .order("issue_number", { ascending: false });

  return NextResponse.json({ issues: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const body = await request.json().catch(() => null);

  if (body?.action === "delete") {
    const { error } = await admin.from("magazine_issues").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body?.action !== "create" && body?.action !== "update") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const issueNumber = Number(body.issueNumber);
  if (!title) return NextResponse.json({ error: "Issue title is required." }, { status: 400 });
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) return NextResponse.json({ error: "Enter a valid issue number." }, { status: 400 });

  let coverImageUrl: string | undefined;
  if (body.coverImageUrl) {
    if (!String(body.coverImageUrl).startsWith(PHOTO_URL_PREFIX)) {
      return NextResponse.json({ error: "Unexpected cover URL." }, { status: 400 });
    }
    coverImageUrl = body.coverImageUrl;
  }

  let pdfUrl: string | undefined;
  if (body.pdfUrl) {
    if (!String(body.pdfUrl).startsWith(PDF_URL_PREFIX)) {
      return NextResponse.json({ error: "Unexpected PDF URL." }, { status: 400 });
    }
    pdfUrl = body.pdfUrl;
  }

  if (body.action === "create") {
    const { error } = await admin.from("magazine_issues").insert({
      title,
      issue_number: issueNumber,
      description: body.description ? String(body.description).trim() : null,
      content: body.content ? String(body.content).trim() : null,
      cover_image_url: coverImageUrl ?? null,
      pdf_url: pdfUrl ?? null,
      published_at: body.publishedAt ? new Date(body.publishedAt).toISOString() : new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const update: IssueUpdate = {
    title,
    issue_number: issueNumber,
    description: body.description ? String(body.description).trim() : null,
    content: body.content ? String(body.content).trim() : null,
  };
  if (body.publishedAt) update.published_at = new Date(body.publishedAt).toISOString();
  if (coverImageUrl) update.cover_image_url = coverImageUrl;
  if (pdfUrl) update.pdf_url = pdfUrl;

  const { error } = await admin.from("magazine_issues").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
