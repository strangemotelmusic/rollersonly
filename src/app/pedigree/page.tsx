import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const recentBirds = [
  { color: "#4A6FA5", name: "Blue Bar Champion Cock", ring: "AU24-TX-44821", loft: "Anderson Elite Loft", breed: "Birmingham Roller", year: 2024, certs: ["Verified Pedigree", "DNA Cert", "Health Cert"] },
  { color: "#C0392B", name: "Red Self Breeding Hen", ring: "AU23-CA-18204", loft: "Martinez Champion Loft", breed: "Birmingham Roller", year: 2023, certs: ["Verified Pedigree", "Health Cert"] },
  { color: "#9B59B6", name: "Lavender Cock", ring: "AU24-NL-00442", loft: "Sterling Dutch Loft", breed: "Birmingham Roller", year: 2024, certs: ["Verified Pedigree", "DNA Cert"] },
  { color: "#ECF0F1", name: "White Badge Hen", ring: "AU24-UK-09871", loft: "Royal Birmingham Loft", breed: "Birmingham Roller", year: 2024, certs: ["Verified Pedigree", "DNA Cert", "Health Cert"] },
  { color: "#2C3E50", name: "Black Centertail Cock", ring: "AU25-TX-11203", loft: "Khan Loft", breed: "Birmingham Roller", year: 2025, certs: ["Verified Pedigree"] },
  { color: "#E74C3C", name: "Recessive Red Hen", ring: "AU24-AZ-33401", loft: "Desert Loft", breed: "Birmingham Roller", year: 2024, certs: ["Verified Pedigree", "Health Cert"] },
];

export default function PedigreePage() {
  return (
    <>
      <Nav active="/pedigree" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HERO */}
        <div style={{ background: "var(--void)", padding: "80px 64px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>Pedigree Vault — Registry & Bloodline Archive</p>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 20, maxWidth: 700 }}>
            The World&apos;s Most Trusted Roller Pigeon <em style={{ color: "var(--gold)" }}>Pedigree Registry</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620, marginBottom: 48 }}>
            Every bird registered on RollersOnly receives a unique platform ID. Pedigrees are entered, verified, and locked — creating tamper-proof bloodline chains that buyers can inspect before bidding.
          </p>

          <div style={{ display: "flex", gap: 12, maxWidth: 700, marginBottom: 24 }}>
            <input type="text" placeholder="Search by ring number, bird name, loft, or bloodline… (e.g. AU24-TX-44821)" style={{ flex: 1, background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "14px 20px", fontSize: 14, borderRadius: 2, outline: "none" }} />
            <button className="btn-gold" style={{ padding: "14px 28px", fontSize: 13, whiteSpace: "nowrap" }}>Search Vault</button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["NBRC World Cup Line", "Anderson Bloodline", "SW Regional Champions", "Blue Bar", "Red Self", "Birmingham Heritage"].map((tag) => (
              <span key={tag} style={{ fontSize: 11, letterSpacing: "0.06em", padding: "5px 14px", border: "0.5px solid var(--border-gold)", color: "var(--gold)", borderRadius: 1, cursor: "pointer" }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div className="rs-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", background: "var(--surface)" }}>
          {[["2,847", "Birds registered"], ["412", "Verified lofts"], ["8,200+", "Pedigree connections"], ["100%", "Tamper-proof records"]].map(([val, label]) => (
            <div key={label} style={{ padding: "40px 48px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 48, fontWeight: 300, color: "var(--white)", lineHeight: 1, marginBottom: 8 }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="rs-2col-b rs-pad-lg" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, padding: "64px", alignItems: "start" }}>
          <div style={{ paddingRight: 64 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)" }}>Recently Registered Birds</div>
              <a href="/browse" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>Browse full registry →</a>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                  {["", "Bird / Ring Number", "Loft", "Breed", "Year", "Certifications", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBirds.map((bird) => (
                  <tr key={bird.ring} style={{ borderBottom: "0.5px solid var(--border)" }}>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: bird.color }} />
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 2 }}>{bird.name}</div>
                      <div style={{ fontSize: 11, color: "var(--gold)" }}>{bird.ring}</div>
                    </td>
                    <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{bird.loft}</td>
                    <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{bird.breed}</td>
                    <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{bird.year}</td>
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {bird.certs.map((c) => <span key={c} className="tag" style={{ fontSize: 9 }}>{c}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <Link href={`/birds/1`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none" }}>View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PEDIGREE TREE */}
            <div style={{ marginTop: 64 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>Bloodline Tree — Anderson&apos;s Thunder</div>
                <a href="#" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>Download PDF →</a>
              </div>

              <div style={{ display: "flex", gap: 20, alignItems: "center", overflowX: "auto", paddingBottom: 16 }}>
                <TreeGen label="Subject">
                  <TreeNode name="Anderson's Thunder" ring="AU23-TX-18204" note="97/100 · NBRC Champion 2025" gold />
                </TreeGen>
                <span style={{ color: "var(--gold)", fontSize: 24, flexShrink: 0 }}>›</span>
                <TreeGen label="Parents">
                  <TreeNode name="TX Bluebell Champion" ring="AU21-TX-00442" note="NBRC Champion 2021" gold />
                  <div style={{ height: 12 }} />
                  <TreeNode name="Silver Queen Hen" ring="AU20-TX-09871" note="World Cup Finalist 2020" />
                </TreeGen>
                <span style={{ color: "var(--gold)", fontSize: 24, flexShrink: 0 }}>›</span>
                <TreeGen label="Grandparents">
                  <TreeNode name="TX Heritage Blue" ring="AU19-TX-00112" note="Heritage line" />
                  <div style={{ height: 8 }} />
                  <TreeNode name="Anderson's Glory" ring="AU18-TX-00089" note="World Cup line" />
                  <div style={{ height: 8 }} />
                  <TreeNode name="Desert Wind Cock" ring="AU19-AZ-00554" note="SW Champion" />
                  <div style={{ height: 8 }} />
                  <TreeNode name="World Cup Hen" ring="AU18-TX-00302" note="World Cup 2018" />
                </TreeGen>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div>
            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", padding: 28, borderRadius: 2, marginBottom: 24 }}>
              <div style={{ fontSize: 24, color: "var(--gold)", marginBottom: 12 }}>◆</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Add Your Bird to the Vault</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>Breeder and Elite Loft subscribers can register birds and build their bloodline records.</p>
              <Link href="/signup" className="btn-gold" style={{ display: "block", textAlign: "center", padding: 12 }}>Register a Bird</Link>
            </div>

            <div style={{ background: "var(--void)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Search by Bloodline</div>
              {["Anderson", "Martinez", "Sterling Dutch", "Royal Birmingham", "Khan"].map((name) => (
                <div key={name} style={{ padding: "10px 0", borderBottom: "0.5px solid var(--border)", fontSize: 13, color: "var(--muted)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                  {name} <span style={{ color: "var(--gold)" }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function TreeGen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

function TreeNode({ name, ring, note, gold }: { name: string; ring: string; note: string; gold?: boolean }) {
  return (
    <div style={{ background: gold ? "rgba(212,175,55,0.05)" : "var(--surface)", border: `0.5px solid ${gold ? "var(--gold)" : "var(--border)"}`, padding: "12px 16px", borderRadius: 2, minWidth: 180, borderLeft: gold ? "2px solid var(--gold)" : undefined }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--white)", marginBottom: 3 }}>{name}</div>
      <div style={{ fontSize: 10, color: "var(--gold)", marginBottom: 3 }}>{ring}</div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{note}</div>
    </div>
  );
}
