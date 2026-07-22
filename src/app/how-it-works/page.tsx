import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const buyerSteps = [
  { num: "01", title: "Create Your Free Account", body: "Sign up in under 2 minutes. Choose Fancier, Breeder, or Elite Loft — your plan determines what you can list, bid, and access." },
  { num: "02", title: "Browse Verified Birds", body: "Every bird on RollersOnly is registered by a verified loft. Filter by breed, color, bloodline, sex, certifications, and competition record." },
  { num: "03", title: "Bid Live", body: "Auctions run in real time. Watch bids update instantly in the auction room. Chat with other buyers and ask the breeder questions during the session." },
  { num: "04", title: "Secure Escrow Payment", body: "Your funds are held in escrow through Stripe — never released to the seller until you confirm the bird arrived healthy and as described." },
  { num: "05", title: "Receive Your Bird", body: "The breeder ships within 48 hours. You inspect the bird, confirm delivery, and funds are released. Simple, protected, done." },
];

const sellerSteps = [
  { num: "01", title: "List Your Bird", body: "Upload up to 8 photos and a same-day video. Enter your bird's ring number, color variety, sex, competition record, and pedigree chain." },
  { num: "02", title: "Set Auction Terms", body: "Choose a starting bid, reserve price (optional), auction duration, and whether it's a buy-now or live-bid format." },
  { num: "03", title: "Go Live", body: "Your auction is published to the RollersOnly marketplace. Verified buyers from around the world can see and bid on your bird instantly." },
  { num: "04", title: "Confirm Shipping", body: "When the auction closes, you receive buyer contact and shipping address. Ship within 48 hours with a tracking number provided through the platform." },
  { num: "05", title: "Get Paid", body: "Funds are released from escrow once the buyer confirms delivery. Payments land in your Stripe account within 2 business days." },
];

const faqs = [
  { q: "What is escrow and why does RollersOnly use it?", a: "Escrow means the buyer's funds are held by a neutral third party (Stripe) until both sides confirm the transaction is complete. This protects buyers from non-delivery and sellers from payment fraud. We use it because roller pigeons are high-value animals and we want every transaction to be 100% safe." },
  { q: "What video do I need to submit as a seller?", a: "You must submit a same-day video of the bird rolling — ideally a 60-90 second clip shot on the day the auction opens. This is not a live stream. It's a recorded submission that buyers can watch during the auction to evaluate roll quality." },
  { q: "How are pedigrees verified?", a: "Pedigrees are entered by the seller and reviewed by our platform team against public NBRC/QSDC records where available. DNA Cert and Health Cert badges are only added when documentation is submitted and reviewed. Verified Pedigree means the chain is entered and locked — it cannot be edited after publication." },
  { q: "Can I sell a breeding pair?", a: "Yes. Breeding pairs are a supported listing type. Both birds must be registered individually in the Pedigree Vault before the pair listing goes live. Buyers can inspect each bird's bloodline separately." },
  { q: "What does the AI Matchmaker do?", a: "The AI Matchmaker analyzes your loft's existing pedigree records and suggests optimal pairing combinations to maximize genetic diversity, reduce line-breeding risk, and predict roll quality based on documented offspring performance. It is a Breeder and Elite Loft feature." },
  { q: "What happens if a bird arrives sick or is not as described?", a: "Open a dispute within 48 hours of delivery. Our team reviews the submitted video, the listing description, and buyer documentation. If the claim is valid, funds are returned to the buyer in full. Seller accounts with repeated disputes are reviewed and may be suspended." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Nav active="/how-it-works" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HERO */}
        <div style={{ background: "var(--void)", padding: "80px 64px 64px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "35%", opacity: 0.06 }}>
            <Image src="/bird-white-red.jpg" alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>How It Works</p>
            <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(40px,5vw,68px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 20, maxWidth: 680 }}>
              The World&apos;s First <em style={{ color: "var(--gold)" }}>Verified Marketplace</em> for Roller Pigeon Breeders
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 560, marginBottom: 40 }}>
              RollersOnly is built from the ground up for the roller pigeon community — by a competitor who has been in the sport since 2003. Every feature exists to protect buyers, reward elite breeders, and move the hobby forward.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/signup" className="btn-gold" style={{ padding: "14px 32px" }}>Start for Free</Link>
              <Link href="/browse" className="btn-ghost" style={{ padding: "14px 32px" }}>Browse Birds</Link>
            </div>
          </div>
        </div>

        {/* TRUST PILLARS */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)" }}>
          {[
            ["◆", "Verified Pedigrees", "Every bloodline entry is locked and tamper-proof"],
            ["🔒", "Escrow-Protected", "Your money is safe until the bird arrives"],
            ["★", "Rated Breeders", "Buyer reviews hold sellers accountable"],
            ["✓", "Same-Day Video", "Buyers see the bird roll before bidding"],
          ].map(([icon, title, desc]) => (
            <div key={String(title)} style={{ padding: "40px 36px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* BUYER / SELLER STEPS */}
        <div className="rs-grid-2 rs-pad-xl" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", padding: "80px 64px", columnGap: 80 }}>

          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>For Buyers</p>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 34, fontWeight: 300, color: "var(--white)", marginBottom: 40, lineHeight: 1.1 }}>Buy with confidence.<br />Bid on birds you trust.</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {buyerSteps.map((step, i) => (
                <div key={step.num} style={{ display: "flex", gap: 24, paddingBottom: 32, paddingTop: i > 0 ? 32 : 0, borderTop: i > 0 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--gold)", lineHeight: 1, minWidth: 52, flexShrink: 0 }}>{step.num}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "var(--white)", marginBottom: 8 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/browse" className="btn-gold" style={{ display: "inline-block", marginTop: 8, padding: "14px 32px" }}>Browse Live Auctions</Link>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>For Sellers</p>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 34, fontWeight: 300, color: "var(--white)", marginBottom: 40, lineHeight: 1.1 }}>Sell globally.<br />Get paid safely.</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sellerSteps.map((step, i) => (
                <div key={step.num} style={{ display: "flex", gap: 24, paddingBottom: 32, paddingTop: i > 0 ? 32 : 0, borderTop: i > 0 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--gold)", lineHeight: 1, minWidth: 52, flexShrink: 0 }}>{step.num}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "var(--white)", marginBottom: 8 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/signup" className="btn-gold" style={{ display: "inline-block", marginTop: 8, padding: "14px 32px" }}>Start Selling</Link>
          </div>
        </div>

        {/* ESCROW CALLOUT */}
        <div style={{ background: "var(--void)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", padding: "72px 64px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 16 }}>Every Dollar Protected by Escrow</div>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, marginBottom: 32 }}>
              We use Stripe&apos;s escrow infrastructure to hold buyer funds until delivery is confirmed. Sellers can ship with confidence knowing payment is secured. Buyers can bid knowing their money won&apos;t move until they say so. No more wire transfers to strangers. No more Facebook marketplace risk.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link href="/signup" className="btn-gold" style={{ padding: "14px 32px" }}>Create Free Account</Link>
              <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost" style={{ padding: "14px 32px" }}>Talk to Us</a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ padding: "80px 64px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>FAQ</p>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 48 }}>Frequently Asked Questions</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ padding: "28px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "var(--white)", marginBottom: 12, paddingRight: 32 }}>{faq.q}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75 }}>{faq.a}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 48, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Still have questions? We&apos;re real people who love this sport.</p>
              <a href="mailto:strangemotelmusic@gmail.com" className="btn-gold" style={{ padding: "14px 32px" }}>Email Us Directly</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
