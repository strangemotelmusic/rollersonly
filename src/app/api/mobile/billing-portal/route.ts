import { NextResponse, type NextRequest } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Mobile equivalent of src/app/actions/stripe.ts's createPortalSession -
// same lookup, but returns the portal URL as JSON instead of redirect().
export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", auth.userId).maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account on file yet." }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: "https://rollersonly.com/dashboard",
  });

  return NextResponse.json({ url: session.url });
}
