import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import EditBirdForm from "./EditBirdForm";

export default async function EditBirdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: bird } = await supabase
    .from("birds")
    .select(
      `id, name, ring_number, sex, color, birth_year, notes, owner_id, primary_photo_url,
       bird_photos(id, url, sort_order),
       auctions(id, status)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!bird) {
    notFound();
  }

  if (bird.owner_id !== user.id) {
    return (
      <>
        <Nav active="/dashboard" />
        <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          You don&apos;t have permission to manage this listing.
        </div>
        <Footer />
      </>
    );
  }

  const auction = bird.auctions?.[0] ?? null;
  const photos = [...(bird.bird_photos ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Manage Listing</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>Starting bid and reserve can&apos;t be changed once a listing is live — cancel and relist if you need to change those.</p>

          <EditBirdForm
            birdId={bird.id}
            auctionId={auction?.id ?? null}
            auctionStatus={auction?.status ?? null}
            initial={{
              name: bird.name ?? "",
              ringNumber: bird.ring_number ?? "",
              sex: bird.sex ?? "cock",
              color: bird.color ?? "",
              birthYear: bird.birth_year ?? new Date().getFullYear(),
              description: bird.notes ?? "",
            }}
            existingPhotos={photos}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
