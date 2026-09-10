import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Bio sourced from stevenrussellharts.com (self-published) - not fabricated.
export default function AboutTheCreatorPage() {
  return (
    <>
      <Nav active="/about-the-creator" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        {/* HERO */}
        <div style={{ background: "var(--void)", padding: "72px 64px 56px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
            About The Creator
          </p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 680 }}>
            Steven Russell <em style={{ color: "var(--gold)" }}>Harts</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620, marginBottom: 32 }}>
            Grammy award-winning music industry veteran, lead vocalist of the multi-platinum R&B group Troop, and
            founder of RollersOnly — built from 25 years flying and competing with Birmingham Rollers.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="https://stevenrussellharts.com" target="_blank" rel="noreferrer" className="btn-gold">
              Visit StevenRussellHarts.com
            </a>
            <a href="mailto:strangemotelmusic@gmail.com" className="btn-ghost">Contact</a>
          </div>
        </div>

        <div style={{ padding: "64px", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 32, fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}>
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Music Career
              </div>
              <p>
                Steven is a lead vocalist for the multi-platinum 1980s R&B group Troop, known for hits like &ldquo;Spread My
                Wings&rdquo; and &ldquo;All I Do Is Think of You,&rdquo; and featured on TV One&apos;s <em>Unsung</em> in 2014. Over a
                25-year career, he has written and produced for artists including Chris Brown, Beyoncé, Jennifer Hudson,
                Tyrese, B2K, and Charlie Wilson — earning Grammy Awards in 2009 and 2012. His music also appears on major
                film soundtracks including <em>Shrek</em>, <em>Kung Fu Panda</em>, <em>Shark Tale</em>, and <em>Dreamgirls</em>.
              </p>
            </div>

            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Beyond Music
              </div>
              <p>
                Steven is also a visual artist, filmmaker, and author of <em>The Anunnaki Scrolls</em> series. He continues
                to release solo music and offers a Virtual Songwriting Masterclass for aspiring writers and producers.
              </p>
            </div>

            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Why RollersOnly
              </div>
              <p>
                Alongside his music career, Steven has been a competitive Birmingham Roller pigeon flyer since 2003. He
                built RollersOnly to give the roller pigeon community the same thing every serious hobby deserves: a real
                marketplace, real competition data, and a home for the bloodlines and breeders that make the sport what
                it is.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 56, padding: 24, background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
              Find Steven
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
              <a href="https://stevenrussellharts.com" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>
                Website ↗
              </a>
              <a href="https://www.instagram.com/stevenrussellharts_/" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>
                Instagram ↗
              </a>
              <a href="https://www.facebook.com/steven.russell.harts.906/" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>
                Facebook ↗
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
