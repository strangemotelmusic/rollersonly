import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { asPhotoSettingsMap } from "@/lib/our-breeders/crop";
import OurBreedersClient from "./OurBreedersClient";

export default async function OurBreedersPage() {
  const admin = createAdminClient();
  const { data: breeders } = await admin
    .from("our_breeders")
    .select("id, name, sex, color, bloodline, ring_number, flying_record, loft_record, bio, photo_urls, photo_settings")
    .order("sort_order", { ascending: true });

  return (
    <>
      <Nav active="/our-breeders" />
      <OurBreedersClient breeders={(breeders ?? []).map((b) => ({ ...b, photo_settings: asPhotoSettingsMap(b.photo_settings) }))} />
      <Footer />
    </>
  );
}
