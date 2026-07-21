import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import ListBirdForm from "./ListBirdForm";

export default async function ListBirdPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).maybeSingle();
  const { data: loft } = await supabase.from("lofts").select("id").eq("owner_id", user.id).maybeSingle();

  const isBrowseOnly = profile?.tier === "browse";

  return (
    <>
      <Nav active="/list-bird" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>List a Bird</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>Create a real listing — it goes live immediately once submitted.</p>

          {isBrowseOnly ? (
            <div style={{ fontSize: 14, color: "var(--muted)", padding: "24px 0" }}>
              Browse Only members can&apos;t list birds.{" "}
              <a href="/signup" style={{ color: "var(--gold)", textDecoration: "none" }}>Upgrade your plan</a> to start selling.
            </div>
          ) : (
            <ListBirdForm userId={user.id} loftId={loft?.id ?? null} />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
