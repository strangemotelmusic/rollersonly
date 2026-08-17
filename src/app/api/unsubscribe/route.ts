import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const token = request.nextUrl.searchParams.get("t");
  const admin = createAdminClient();

  if (type === "member") {
    const id = request.nextUrl.searchParams.get("id");
    if (id && token) {
      const { data: profile } = await admin.from("profiles").select("unsubscribe_token").eq("id", id).maybeSingle();
      if (profile?.unsubscribe_token === token) {
        await admin.from("profiles").update({ marketing_opt_out: true }).eq("id", id);
      }
    }
  } else {
    const email = request.nextUrl.searchParams.get("email")?.toLowerCase();
    if (email && token) {
      const { data: sub } = await admin
        .from("newsletter_subscribers")
        .select("unsubscribe_token")
        .eq("email", email)
        .maybeSingle();
      if (sub?.unsubscribe_token === token) {
        await admin.from("newsletter_subscribers").update({ unsubscribed_at: new Date().toISOString() }).eq("email", email);
      }
    }
  }

  return NextResponse.redirect(new URL("/unsubscribed", request.url));
}
