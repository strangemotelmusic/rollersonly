import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import TysonsCornerClient from "./TysonsCornerClient";

export const metadata: Metadata = {
  title: "Tyson's Corner — RollersOnly",
};

const BLOODLINES = ["Hannes", "Poen", "McKinney"];

export default async function TysonsCornerPage() {
  const admin = createAdminClient();
  const { data: birds } = await admin
    .from("dots_birds")
    .select("id, name, band_number, age, price_cents, description, photo_url, is_available, bloodline")
    .in("bloodline", BLOODLINES)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav active="/tysons-corner" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ background: "var(--surface)", borderBottom: "0.5px solid var(--border)", padding: "12px 40px", fontSize: 12, color: "var(--muted)" }}>
          Home <span style={{ margin: "0 8px" }}>›</span> <span style={{ color: "var(--white)" }}>Tyson&apos;s Corner</span>
        </div>

        <div style={{ padding: "56px 40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
            South African Bloodlines
          </p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,52px)", fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
            Tyson&apos;s <em style={{ color: "var(--gold)" }}>Corner</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 640, margin: "0 auto", lineHeight: 1.7 }}>
            Mike Tyson and his family of South African bloodlines — the Tyson line is built on the Hannes, Poen, and
            McKinney bloodlines. Order directly and we&apos;ll get your birds shipped to your door.
          </p>
        </div>

        <TysonsCornerClient birds={birds ?? []} />
      </div>
      <Footer />
    </>
  );
}
