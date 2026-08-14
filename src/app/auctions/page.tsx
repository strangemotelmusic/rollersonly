import Nav from "@/components/Nav";
import AuctionsClient from "./AuctionsClient";
import { getSiteImages } from "@/lib/site-images";

export default async function AuctionsPage() {
  const images = await getSiteImages();
  return (
    <>
      <Nav active="/auctions" />
      <AuctionsClient images={images} />
    </>
  );
}
