import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import ReserveForm from "./ReserveForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Decade of the Spinner — The Magazine for Real Kits & Real Breaks",
};

export default function DecadeOfTheSpinnerPage() {
  return (
    <div className={styles.landing}>
      <nav className={styles.nav}>
        <div className={styles.wrap}>
          <div className={styles.navMark}>
            <svg className={styles.eagle} viewBox="0 0 100 100">
              <use href="#eagle-mark" />
            </svg>
            <span>DECADE OF THE SPINNER</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/">← Rollers Only</Link>
            <a href="#inside">Inside the Loft</a>
            <a href="#cover-story">Cover Story</a>
            <a href="#pillars">Our Values</a>
            <a href="#subscribe">Subscribe</a>
          </div>
          <a className={styles.navCta} href="#subscribe">
            Get Issue 1
          </a>
        </div>
      </nav>

      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <g id="eagle-mark">
            <path d="M50 8 L54 22 L66 14 L60 28 L82 24 L64 36 L88 40 L62 44 L80 56 L58 50 L64 68 L50 54 L36 68 L42 50 L20 56 L38 44 L12 40 L36 36 L18 24 L40 28 L34 14 L46 22 Z" />
            <circle cx="50" cy="34" r="4" />
          </g>
        </defs>
      </svg>

      <header>
        <div className={styles.coverPlain}>
          <Image
            src="/decade-of-the-spinner/cover.jpg"
            alt="Decade of the Spinner - debut cover featuring Rick Schoening"
            className={styles.coverPlainImg}
            width={1023}
            height={1537}
            priority
          />
        </div>
        <div className={styles.coverCtaHint}>
          <a href="#subscribe">Scroll to reserve Issue 1 ↓</a>
        </div>
      </header>

      <section id="inside">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>What&apos;s Inside Issue One</h2>
            <p>Four departments, one obsession — the roll, the kit, and the flyers who chase both.</p>
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.num}>Dept. 01</div>
              <h3>Inside the Loft</h3>
              <p>An exclusive look behind the scenes at the lofts, the routines, and the small rituals that build champions.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.num}>Dept. 02</div>
              <h3>The Birds</h3>
              <p>The foundation of greatness — bloodlines, breeding decisions, and the spinners that started it all.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.num}>Dept. 03</div>
              <h3>The Mindset</h3>
              <p>What it takes to win — the patience, discipline, and long view that separates a kit from a champion team.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.num}>Dept. 04</div>
              <h3>World Cup Journey</h3>
              <p>The road to the top, season by season — every setback, every break, every point that mattered.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cover-story" className={styles.coverStory}>
        <div className={styles.wrap}>
          <div className={styles.storyCopy}>
            <span className={styles.eyebrow}>Cover Story</span>
            <h2>
              A True Champion.
              <br />A Lasting Legacy.
            </h2>
            <p>
              Ten years of frequency, kitting, roll and score come down to one kit, one break, one champion. In our
              debut issue, World Cup Roller Flying Champion Rick Schoening opens the loft door and walks us through
              the decade that built the win.
            </p>
            <p>
              From the birds that started it all to the mindset that carried a kit through every round of
              competition, this is the story of what it really takes to stand on top of the world.
            </p>
            <p className={styles.sub}>Brotherhood · Legacy · Respect · Unity · Rollers Forever</p>
          </div>
        </div>
      </section>

      <section id="pillars" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            <span>Brotherhood</span>
            <span>Legacy</span>
            <span>Respect</span>
            <span>Unity</span>
            <span>Rollers Forever</span>
            <span>Brotherhood</span>
            <span>Legacy</span>
            <span>Respect</span>
            <span>Unity</span>
            <span>Rollers Forever</span>
          </div>
        </div>
      </section>

      <section id="subscribe" className={styles.subscribe}>
        <div className={styles.wrap}>
          <Image
            className={styles.trophyShot}
            src="/decade-of-the-spinner/trophy.jpg"
            alt="World Cup Roller Flying Champion trophy"
            width={435}
            height={690}
          />
          <h2>Claim Volume 1, Issue 1</h2>
          <p>
            Celebrating legacy, unity and passion — reserve the 2027 limited-edition debut issue of Decade of the
            Spinner before it leaves the loft.
          </p>
          <ReserveForm />
          <div className={styles.fine}>Ships Spring 2027 · Limited print run</div>
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
                Decade of the Spinner
                <small>Real Kits &amp; Real Breaks</small>
              </div>
            </div>
            <div className={styles.footerLinks}>
              <a href="#inside">Departments</a>
              <a href="#cover-story">Cover Story</a>
              <a href="#subscribe">Subscribe</a>
              <Link href="/magazine">Member Magazine →</Link>
            </div>
          </div>
          <div className={styles.copyright}>
            © 2027 Decade of the Spinner Magazine · Brotherhood · Legacy · Respect · Unity · Rollers Forever
          </div>
        </div>
      </footer>
    </div>
  );
}
