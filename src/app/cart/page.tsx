import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Your Cart — RollersOnly",
};

export default function CartPage() {
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Your Cart
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Review your birds before checking out.
          </p>
          <CartClient />
        </div>
      </div>
      <Footer />
    </>
  );
}
