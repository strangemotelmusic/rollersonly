import Link from "next/link";
import type { Metadata } from "next";
import MatchBuilder from "./MatchBuilder";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Custom Breeding Matchmaking — Rollers Only",
};

const STEPS = [
  { n: "01", title: "Browse Verified Lofts", desc: "Every breeder on Rollers Only is verified for pedigree records and competition history before their birds are listed." },
  { n: "02", title: "Select Sire & Dam", desc: "Pick one male and one female — from the same loft or two different verified lofts — for your custom pairing." },
  { n: "03", title: "Reserve With a Deposit", desc: "Pay a $500 deposit to lock in your pairing request. The breeder is notified immediately." },
  { n: "04", title: "Breeder Confirms", desc: "Your breeder confirms availability and timeline, and coordinates the pairing and offspring delivery directly with you." },
];

const TERMS = [
  { title: "What the deposit covers", desc: "Your $500 deposit reserves your requested sire and dam pairing with the breeder. It's the first of two payments — a $500 balance is still due once your bird is bred." },
  { title: "The remaining $500 balance", desc: "Once the pairing produces offspring and your bird is weaned and ready, your breeder will invoice you for the remaining $500 before the bird ships or is picked up." },
  { title: "Availability isn't guaranteed until confirmed", desc: "Breeding pairs can only produce a limited number of rounds per season. Your breeder will confirm timing and availability directly after your deposit is placed." },
  { title: "Working with two different lofts", desc: "If your sire and dam come from different verified lofts, Rollers Only coordinates the introduction between both breeders on your behalf." },
  { title: "Refunds", desc: "Deposits are refundable if a breeder is unable to confirm your requested pairing. Once a pairing is confirmed, standard breeder cancellation terms apply." },
  { title: "If a pairing doesn't produce offspring", desc: "If a confirmed pairing fails to produce a bird, your $500 deposit is refunded or credited toward a new pairing of your choice — you're never charged the remaining balance for a bird that wasn't delivered." },
];

export default function MatchmakingPage() {
  return (
    <div className={styles.landing}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <g id="eagle-mark">
            <path d="M50 8 L54 22 L66 14 L60 28 L82 24 L64 36 L88 40 L62 44 L80 56 L58 50 L64 68 L50 54 L36 68 L42 50 L20 56 L38 44 L12 40 L36 36 L18 24 L40 28 L34 14 L46 22 Z" />
            <circle cx="50" cy="34" r="4" />
          </g>
        </defs>
      </svg>

      <nav className={styles.nav}>
        <div className={styles.wrap}>
          <div className={styles.navMark}>
            <svg className={styles.eagle} viewBox="0 0 100 100">
              <use href="#eagle-mark" />
            </svg>
            <div>
              <span>ROLLERS ONLY</span>
              <small>Verified Breeder Matchmaking</small>
            </div>
          </div>
          <div className={styles.navLinks}>
            <Link href="/">← Rollers Only</Link>
            <a href="#lofts">Verified Lofts</a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#match">Build a Pairing</a>
            <a href="#terms">Terms</a>
          </div>
          <a className={styles.navCta} href="#match">
            Start Matchmaking
          </a>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>Verified Lofts &nbsp;•&nbsp; Custom Pairings &nbsp;•&nbsp; $500 Deposit</div>
          <h1>
            Choose the Sire.
            <br />
            Choose the Dam.
            <br />
            Own the Bloodline.
          </h1>
          <p>
            Hand-select the exact birds behind your next champion. Browse verified breeder lofts, pick a sire and dam
            you want paired, and reserve the pairing with a $500 deposit — no guesswork, no waitlist raffles.
          </p>
          <div className={styles.heroStats}>
            <div>
              <strong>18</strong>
              <span>Verified Lofts</span>
            </div>
            <div>
              <strong>240+</strong>
              <span>Birds Listed</span>
            </div>
            <div>
              <strong>$500</strong>
              <span>Reserves a Pairing</span>
            </div>
          </div>
        </div>
      </header>

      <section id="how">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>How Matchmaking Works</h2>
            <p>Four steps from browsing to a confirmed pairing in your loft.</p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((s) => (
              <div key={s.n} className={styles.step}>
                <div className={styles.n}>{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MatchBuilder />

      <section id="pricing" className={styles.loftsBand}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>Two Payments, No Surprises</h2>
            <p>Every pairing is billed in two parts — a deposit to reserve it, and a balance once your bird is bred and ready.</p>
          </div>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingStep}>Payment 1</div>
              <div className={styles.pricingAmt}>$500</div>
              <h3>Deposit — Due Today</h3>
              <p>Paid when you reserve your sire &amp; dam pairing. This locks in your request with the breeder and confirms your place in the pairing queue.</p>
            </div>
            <div className={styles.pricingConnector}>+</div>
            <div className={styles.pricingCard}>
              <div className={styles.pricingStep}>Payment 2</div>
              <div className={styles.pricingAmt}>$500</div>
              <h3>Balance — Due at Delivery</h3>
              <p>Paid once the pairing has produced offspring and your bird is ready to ship or be picked up. Your breeder will invoice you directly at that time.</p>
            </div>
            <div className={styles.pricingConnector}>=</div>
            <div className={`${styles.pricingCard} ${styles.pricingTotal}`}>
              <div className={styles.pricingStep}>Total Cost</div>
              <div className={styles.pricingAmt}>$1,000</div>
              <h3>Per Bird, Start to Finish</h3>
              <p>No hidden fees between reservation and delivery. The deposit and balance together cover your full custom-bred bird.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="terms" className={styles.terms}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>Deposit &amp; Pairing Terms</h2>
          </div>
          <div className={styles.termsGrid}>
            {TERMS.map((t) => (
              <div key={t.title} className={styles.term}>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className={styles.wrap}>
          <div className={styles.footerGrid}>
            <div className={styles.footerMark}>
              <svg className={styles.eagle} viewBox="0 0 100 100">
                <use href="#eagle-mark" />
              </svg>
              <div>
                Rollers Only
                <small>Verified Breeder Matchmaking</small>
              </div>
            </div>
          </div>
          <div className={styles.copyright}>© 2027 Rollers Only · Brotherhood · Legacy · Respect · Unity · Rollers Forever</div>
        </div>
      </footer>
    </div>
  );
}
