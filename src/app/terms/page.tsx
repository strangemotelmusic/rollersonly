import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Draft terms tailored to RollersOnly's actual features (tiered
// subscriptions, live auctions, Stripe escrow, live-animal shipping) as of
// the LAST_UPDATED date below. Not attorney-reviewed - Steven should have
// counsel review before relying on it, especially the live-animal shipping
// and liability sections, but it accurately reflects how the Service
// actually works today.
const LAST_UPDATED = "September 6, 2026";

const ulStyle: React.CSSProperties = { paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 };

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By creating an account or using rollersonly.com or the RollersOnly mobile app (together, the &quot;Service&quot;),
        you agree to these Terms of Service and our <Link href="/privacy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>.
        If you do not agree, do not use the Service.
      </p>
    ),
  },
  {
    title: "2. Eligibility",
    body: (
      <p>
        You must be at least 18 years old and able to form a binding contract to use the Service. By registering, you
        confirm the information you provide is accurate and that you are legally permitted to buy, sell, and ship
        live birds in your jurisdiction.
      </p>
    ),
  },
  {
    title: "3. Membership Tiers & Billing",
    body: (
      <>
        <p>
          RollersOnly offers Fancier, Breeder, and Elite Loft subscription tiers, each unlocking different platform
          features (listing limits, the Decade of the Spinner magazine, auction commission rate, etc.), billed
          monthly through Stripe.
        </p>
        <ul style={ulStyle}>
          <li>Subscriptions renew automatically each billing period until cancelled.</li>
          <li>You can cancel anytime from Account Settings; cancellation takes effect at the end of the current billing period.</li>
          <li>Fees are non-refundable except where required by law.</li>
          <li>RollersOnly charges a 5% commission on completed auction sales, deducted from the seller&apos;s payout.</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Auctions, Bidding & Escrow",
    body: (
      <>
        <ul style={ulStyle}>
          <li>Placing a bid is a binding offer to purchase at that price if you win the auction.</li>
          <li>Buyer funds are held in escrow via Stripe and are not released to the seller until the buyer confirms delivery, or the dispute window closes without a dispute being opened.</li>
          <li>Sellers must ship the bird within 48 hours of auction close and provide tracking information through the platform.</li>
          <li>Buyers must open any delivery dispute within 48 hours of receiving the bird. Unresolved disputes are reviewed by RollersOnly, whose decision on fund release is final.</li>
          <li>RollersOnly is a marketplace facilitator, not a party to the underlying sale between buyer and seller.</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Live Animal Shipping & Compliance",
    body: (
      <p>
        Roller pigeons are live animals. Buyers and sellers are solely responsible for complying with all applicable
        federal, state, local, and international laws and carrier regulations governing the sale, transport, and
        import/export of live birds — including any required permits, health certificates, or quarantine rules.
        RollersOnly does not verify legal compliance for any individual shipment and is not liable for shipping
        delays, carrier issues, or losses arising from a user&apos;s failure to comply with applicable law.
      </p>
    ),
  },
  {
    title: "6. Listings & Content Standards",
    body: (
      <>
        <p>When listing a bird or posting content on RollersOnly, you agree that:</p>
        <ul style={ulStyle}>
          <li>Pedigree, health, DNA-certification, and competition-record claims are accurate and truthful.</li>
          <li>Photos and videos you submit are your own or you have the right to use them.</li>
          <li>You will not list anything other than live birds, breeding services, and related goods permitted by the platform.</li>
          <li>You will not use the Service to harass other users, post fraudulent listings, or attempt to circumvent escrow (e.g., soliciting off-platform payment to avoid fees).</li>
        </ul>
        <p>We may remove listings or content, and suspend or terminate accounts, that violate these standards.</p>
      </>
    ),
  },
  {
    title: "7. User Conduct",
    body: (
      <p>
        You agree not to misuse the Service — including attempting to access other users&apos; accounts, interfering
        with the operation of the Service, scraping data, or using the Service for any unlawful purpose.
      </p>
    ),
  },
  {
    title: "8. Intellectual Property",
    body: (
      <p>
        You retain ownership of content you upload (photos, videos, pedigree data, listing text). By posting it on
        RollersOnly, you grant us a non-exclusive, worldwide license to host, display, and distribute that content as
        needed to operate the Service (for example, showing your listing to buyers). The RollersOnly name, logo, and
        site design are our property and may not be used without permission.
      </p>
    ),
  },
  {
    title: "9. Disclaimers & Limitation of Liability",
    body: (
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. RollersOnly does not guarantee the
        health, pedigree accuracy, or condition of any bird listed by a third-party user. To the fullest extent
        permitted by law, RollersOnly is not liable for indirect, incidental, or consequential damages arising from
        your use of the Service or any transaction between users.
      </p>
    ),
  },
  {
    title: "10. Termination",
    body: (
      <p>
        We may suspend or terminate your account at any time for violation of these Terms. You may stop using the
        Service and close your account at any time by contacting us.
      </p>
    ),
  },
  {
    title: "11. Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law principles, and
        any disputes will be resolved in the state or federal courts located in Texas, unless applicable law requires
        otherwise.
      </p>
    ),
  },
  {
    title: "12. Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. If we make material changes, we&apos;ll update the &quot;Last
        updated&quot; date below and, where appropriate, notify you directly. Continued use of the Service after
        changes take effect constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    title: "13. Contact Us",
    body: (
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:strangemotelmusic@gmail.com" style={{ color: "var(--gold)" }}>strangemotelmusic@gmail.com</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <Nav active="/terms" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ background: "var(--void)", padding: "64px 64px 48px", borderBottom: "0.5px solid var(--border)" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Last updated: {LAST_UPDATED}</p>
        </div>

        <div style={{ padding: "56px 64px 96px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", color: "var(--muted)", fontSize: 14, lineHeight: 1.8 }}>
            {sections.map((s) => (
              <div key={s.title} style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 400, color: "var(--white)", marginBottom: 14 }}>{s.title}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{s.body}</div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              See also our <Link href="/privacy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
