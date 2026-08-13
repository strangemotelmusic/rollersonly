import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import DotsBirdsClient from "./DotsBirdsClient";

export const metadata: Metadata = {
  title: "Buy D.O.T.S Birds — RollersOnly",
};

export default async function DotsBirdsPage() {
  const admin = createAdminClient();
  const { data: birds } = await admin
    .from("dots_birds")
    .select("id, name, band_number, age, price_cents, description, photo_url, is_available")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav active="/dots-birds" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ background: "var(--surface)", borderBottom: "0.5px solid var(--border)", padding: "12px 40px", fontSize: 12, color: "var(--muted)" }}>
          Home <span style={{ margin: "0 8px" }}>›</span> <span style={{ color: "var(--white)" }}>Buy D.O.T.S Birds</span>
        </div>

        <div style={{ padding: "56px 40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
            Direct From The Loft
          </p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,52px)", fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
            Buy <em style={{ color: "var(--gold)" }}>D.O.T.S</em> Birds
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 560, margin: "0 auto" }}>
            Birds bred and flown by Rollers Only — sold directly, no auction, no waiting. Add any bird to your cart and check out when you&apos;re ready.
          </p>
        </div>

        <DotsBirdsClient birds={birds ?? []} />
      </div>
      <Footer />
    </>
  );
}
