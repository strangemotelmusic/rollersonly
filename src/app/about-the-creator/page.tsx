import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Steven's bio sourced from stevenrussellharts.com (self-published). The
// "how we met" story and Mike's pigeon history were given directly by
// Steven, describing his own real relationship and partnership with Mike -
// not invented. Mike's boxing record (youngest heavyweight champion in
// history, 1986) is well-documented public record.
export default function AboutTheCreatorPage() {
  return (
    <>
      <Nav active="/about-the-creator" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        {/* HERO */}
        <div style={{ background: "var(--void)", padding: "72px 64px 56px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
            The Founders
          </p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 760 }}>
            Steven Russell Harts <span style={{ color: "var(--muted)", fontWeight: 300 }}>&amp;</span> <em style={{ color: "var(--gold)" }}>Mike Tyson</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 680, marginBottom: 32 }}>
            Two friends who found each other through pigeons nearly 40 years ago — a multi-platinum recording artist
            and the youngest heavyweight champion in boxing history — who came back together two decades later to
            build a real home for the sport that first connected them.
          </p>
        </div>

        <div style={{ padding: "64px", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 48, fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}>

            {/* HOW THEY MET */}
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                How They Met
              </div>
              <p>
                Steven and Mike met backstage at the Apollo Theater in 1988. Steven — then singing lead for the
                R&amp;B group Troop — was introduced to Mike by singer Aaron Hall: &ldquo;Hey Mike, this is Steve, from
                Troop.&rdquo; Mike lit up — &ldquo;I love Troop&rdquo; — and gave Steven a hard, friendly slap on the back.
              </p>
              <p>
                Then Aaron Hall added one more thing: &ldquo;Mike, Steve&apos;s got pigeons too.&rdquo;
              </p>
              <p>
                The slap turned into a hug. As Steven tells it, it was instant — like meeting a brother. Two men from
                completely different worlds, bonded in a moment over the birds they&apos;d both grown up keeping.
              </p>
            </div>

            {/* MIKE */}
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Mike Tyson
              </div>
              <p>
                Mike started keeping pigeons around age 8, catching his first birds himself on the streets of
                Brooklyn. Pigeons were his first real love before boxing ever entered the picture — and they led
                directly to his first fight. At 12 years old, a bully grabbed one of his birds and broke its neck
                in front of him. Mike beat him badly. It was the first real fight of his life.
              </p>
              <p>
                Mike went on to become the youngest heavyweight champion in boxing history, at 20 years old, and one
                of the most recognized athletes on the planet. Through all of it, the pigeons never left him — over
                the years his birds grew to include some of the finest South African bloodlines in the sport. When
                Mike discovered rollers specifically, and saw how deep Steven&apos;s own passion for the breed ran, it
                clicked — this wasn&apos;t just a shared childhood hobby anymore, it was something they both still lived.
              </p>
            </div>

            {/* STEVEN */}
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Steven Russell Harts
              </div>
              <p>
                Steven is a lead vocalist for the multi-platinum 1980s R&amp;B group Troop, known for hits like &ldquo;Spread My
                Wings&rdquo; and &ldquo;All I Do Is Think of You,&rdquo; and featured on TV One&apos;s <em>Unsung</em> in 2014. Over a
                25-year career, he has written and produced for artists including Chris Brown, Beyoncé, Jennifer Hudson,
                Tyrese, B2K, and Charlie Wilson — earning Grammy Awards in 2009 and 2012. His music also appears on major
                film soundtracks including <em>Shrek</em>, <em>Kung Fu Panda</em>, <em>Shark Tale</em>, and <em>Dreamgirls</em>. He is also a
                visual artist, filmmaker, and author of <em>The Anunnaki Scrolls</em> series.
              </p>
              <p>
                Alongside his music career, Steven has been a competitive Birmingham Roller pigeon flyer since 2003.
              </p>
            </div>

            {/* 20 YEARS LATER */}
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Twenty Years Later
              </div>
              <p>
                Mike went on to become a world champion. Steven went on to sell millions of records. But every time
                their paths crossed over the following decades, the conversation always found its way back to
                pigeons.
              </p>
              <p>
                When Steven told Mike he wanted to build a real platform and magazine for the roller pigeon
                community, Mike didn&apos;t hesitate. &ldquo;Let&apos;s do it together.&rdquo; RollersOnly is the result — built by
                two lifelong fanciers who want serious breeders and competitors to be able to actually acquire the
                bloodlines they need to compete at the highest level, and to keep this community alive for the next
                generation.
              </p>
            </div>

            {/* BLOODLINES NOTE */}
            <div style={{ padding: 24, background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 300, color: "var(--white)", marginBottom: 10 }}>
                Two Bloodlines, One Mission
              </div>
              <p style={{ margin: 0 }}>
                <a href="/tysons-corner" style={{ color: "var(--gold)" }}>Tyson&apos;s Corner</a> is home to Mike&apos;s own
                South African bloodlines — Hannes, Poen, and McKinney. <a href="/dots-birds" style={{ color: "var(--gold)" }}>D.O.T.S.</a> is
                where you&apos;ll find Steven&apos;s own birds, bred and flown at his loft. Same mission, two lofts.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 56, padding: 24, background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
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
