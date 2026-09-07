import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Draft policy tailored to RollersOnly's actual data practices as of the
// LAST_UPDATED date below. This has not been reviewed by an attorney -
// Steven should have counsel review before relying on it for compliance
// (App Store / Play Store review, GDPR/CCPA, etc.), but it accurately
// describes what the app and site actually collect and do today.
const LAST_UPDATED = "September 6, 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Who We Are",
    body: (
      <p>
        RollersOnly (&quot;RollersOnly,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the RollersOnly website
        (rollersonly.com) and the RollersOnly mobile app (together, the &quot;Service&quot;) — a marketplace and community
        platform for Birmingham Roller pigeon breeders and competitors. This Privacy Policy explains what information
        we collect, how we use it, and the choices you have.
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    body: (
      <>
        <p><strong>Account information.</strong> When you create an account we collect your email address, a username or display name, and (optionally) your full name, avatar photo, and loft/location details you choose to add to your profile.</p>
        <p><strong>Content you provide.</strong> Photos and videos of birds, pedigree and bloodline records, ring numbers, listing descriptions, chat messages with other users, loft reviews, and any other content you upload or submit.</p>
        <p><strong>Payment information.</strong> Subscription payments and auction settlements are processed by Stripe. We do not store your full card number — Stripe handles payment details directly and shares with us only what&apos;s needed to manage your subscription tier and transaction history (e.g., subscription status, last 4 digits of a card, transaction amounts).</p>
        <p><strong>Sign-in methods.</strong> If you sign in with Apple, we receive the identifier and (if you share it) name/email Apple provides. If you sign in with email and password, your password is never visible to us — Supabase Auth stores it in hashed form.</p>
        <p><strong>Device and usage information.</strong> On the mobile app, we collect a device push-notification token (if you enable notifications) so we can deliver chat and auction alerts. On both the site and app, we log basic technical data (IP address, browser/device type, pages visited) for security and troubleshooting.</p>
        <p><strong>Biometric authentication.</strong> If you enable Face ID / fingerprint unlock in the mobile app, that authentication happens entirely on your device through Apple/Google&apos;s operating system APIs — RollersOnly never receives, transmits, or stores your biometric data.</p>
        <p><strong>Camera and photo library access.</strong> The mobile app requests camera and photo library permission only to let you attach photos/videos to listings, chat messages, and pedigree records. We only access what you actively choose to share.</p>
      </>
    ),
  },
  {
    title: "3. How We Use Your Information",
    body: (
      <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <li>Operate the marketplace: create listings, run live auctions, process bids, and facilitate escrow-protected payments through Stripe.</li>
        <li>Manage your account, subscription tier, and billing.</li>
        <li>Send transactional communications — auction updates, chat notifications, order/escrow status, and account security alerts.</li>
        <li>Display your public profile, loft, listings, and pedigree records to other users as intended by the Service&apos;s core functionality.</li>
        <li>Maintain platform safety: detect fraud, enforce our Terms of Service, and review disputes.</li>
        <li>Improve the Service through aggregate, non-identifying usage analysis.</li>
      </ul>
    ),
  },
  {
    title: "4. How We Share Information",
    body: (
      <>
        <p>We do not sell your personal information. We share information only with:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li><strong>Stripe</strong> — to process subscription payments and auction escrow settlements.</li>
          <li><strong>Supabase</strong> — our database, authentication, and file-storage infrastructure provider, which hosts the data described above on our behalf.</li>
          <li><strong>Other users</strong> — content you choose to make public (listings, profile, loft page, reviews, chat messages with the recipient) is visible to the relevant audience by design of the Service.</li>
          <li><strong>Law enforcement or legal process</strong> — if required to comply with a valid legal request, or to protect the rights, safety, or property of RollersOnly or our users.</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Data Retention & Deletion",
    body: (
      <p>
        We retain account and transaction records for as long as your account is active and as needed to comply with
        legal, tax, and dispute-resolution obligations. Most records (listings, auctions, reviews) use a soft-delete
        design — removed content is hidden from public view but retained internally for a period to support dispute
        resolution and fraud prevention. To request deletion of your account and associated personal data, email us at{" "}
        <a href="mailto:strangemotelmusic@gmail.com" style={{ color: "var(--gold)" }}>strangemotelmusic@gmail.com</a>.
      </p>
    ),
  },
  {
    title: "6. Your Choices & Rights",
    body: (
      <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <li>You can review and update most of your profile information directly in Account Settings.</li>
        <li>You can disable push notifications at any time in your device settings.</li>
        <li>You can request a copy of, correction to, or deletion of your personal data by contacting us.</li>
        <li>Depending on where you live, you may have additional rights under laws like the CCPA or GDPR — contact us and we will respond consistent with applicable law.</li>
      </ul>
    ),
  },
  {
    title: "7. Children’s Privacy",
    body: (
      <p>
        RollersOnly is not directed to, and does not knowingly collect personal information from, anyone under 18.
        If we learn a child under 18 has created an account, we will delete it. Contact us if you believe a minor has
        provided us information.
      </p>
    ),
  },
  {
    title: "8. Security",
    body: (
      <p>
        We use industry-standard safeguards — including encrypted connections, database-level row security policies,
        and hashed credentials — to protect your information. No system is perfectly secure, and we cannot guarantee
        absolute security of information transmitted to the Service.
      </p>
    ),
  },
  {
    title: "9. Changes to This Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll update the
        &quot;Last updated&quot; date below and, where appropriate, notify you directly.
      </p>
    ),
  },
  {
    title: "10. Contact Us",
    body: (
      <p>
        Questions about this Privacy Policy? Email{" "}
        <a href="mailto:strangemotelmusic@gmail.com" style={{ color: "var(--gold)" }}>strangemotelmusic@gmail.com</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Nav active="/privacy" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ background: "var(--void)", padding: "64px 64px 48px", borderBottom: "0.5px solid var(--border)" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
            Privacy Policy
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
              See also our <Link href="/terms" style={{ color: "var(--gold)" }}>Terms of Service</Link>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
