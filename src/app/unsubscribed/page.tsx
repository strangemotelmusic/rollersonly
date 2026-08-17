import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function UnsubscribedPage() {
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "60vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 32px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
            You&apos;re unsubscribed
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            You won&apos;t receive any more marketing emails from RollersOnly. You can still manage your account settings at any time.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
