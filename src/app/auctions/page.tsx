import Nav from "@/components/Nav";
import AuctionsClient from "./AuctionsClient";

export default function AuctionsPage() {
  return (
    <>
      <Nav active="/auctions" />
      <AuctionsClient />
    </>
  );
}
