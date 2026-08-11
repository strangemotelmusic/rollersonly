"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Sex = "male" | "female";
type Bird = { id: string; name: string; sex: Sex; meta: string };
type Loft = { id: string; name: string; loc: string; region: string; birds: Bird[] };
type Selection = { name: string; meta: string; loft: string };

const LOFTS: Loft[] = [
  {
    id: "lft1",
    name: "Sunrise Ridge Loft",
    loc: "Lubbock, TX",
    region: "tx",
    birds: [
      { id: "b1", name: "Solar Flare", sex: "male", meta: "2024 · Red Grizzle" },
      { id: "b2", name: "Morning Glory", sex: "female", meta: "2023 · Blue Bar" },
    ],
  },
  {
    id: "lft2",
    name: "Coastal Kings Loft",
    loc: "Bakersfield, CA",
    region: "ca",
    birds: [
      { id: "b3", name: "Pacific Ace", sex: "male", meta: "2024 · Black" },
      { id: "b4", name: "Golden Tide", sex: "female", meta: "2024 · Ash Red" },
    ],
  },
  {
    id: "lft3",
    name: "Everglade Spinners",
    loc: "Ocala, FL",
    region: "fl",
    birds: [
      { id: "b5", name: "Cypress King", sex: "male", meta: "2023 · Blue Check" },
      { id: "b6", name: "Egret White", sex: "female", meta: "2024 · White" },
    ],
  },
  {
    id: "lft4",
    name: "Buckeye Bloodline Loft",
    loc: "Dayton, OH",
    region: "oh",
    birds: [
      { id: "b7", name: "Ironclad", sex: "male", meta: "2022 · Dark Check" },
      { id: "b8", name: "Buckeye Belle", sex: "female", meta: "2023 · Red Bar" },
    ],
  },
  {
    id: "lft5",
    name: "Lone Star Legacy Loft",
    loc: "Waco, TX",
    region: "tx",
    birds: [
      { id: "b9", name: "Ranger", sex: "male", meta: "2024 · Grizzle" },
      { id: "b10", name: "Bluebonnet", sex: "female", meta: "2023 · Blue Bar" },
    ],
  },
  {
    id: "lft6",
    name: "Golden Gate Rollers",
    loc: "Fresno, CA",
    region: "ca",
    birds: [
      { id: "b11", name: "Alcatraz", sex: "male", meta: "2023 · Black Grizzle" },
      { id: "b12", name: "Bay Breeze", sex: "female", meta: "2024 · Ash Red" },
    ],
  },
];

const REGIONS = [
  { key: "all", label: "All Regions" },
  { key: "tx", label: "Texas" },
  { key: "ca", label: "California" },
  { key: "fl", label: "Florida" },
  { key: "oh", label: "Ohio" },
];

function PigeonIcon({ sex, className }: { sex: Sex; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100">
      <path
        style={{ fill: sex === "male" ? "var(--gold)" : "var(--maroon-light)" }}
        d="M50 12c-4 0-7 3-7 7 0 2 1 4 2 5-10 3-18 11-21 21-1 3-3 5-6 6-2 1-2 3 0 4 3 1 6 0 8-2 1 4 3 8 6 11-2 1-4 3-5 5-1 2 1 4 3 3 3-1 5-3 7-6 3 2 7 3 11 3s8-1 11-3c2 3 4 5 7 6 2 1 4-1 3-3-1-2-3-4-5-5 3-3 5-7 6-11 2 2 5 3 8 2 2-1 2-3 0-4-3-1-5-3-6-6-3-10-11-18-21-21 1-1 2-3 2-5 0-4-3-7-7-7z"
      />
    </svg>
  );
}

export default function MatchBuilder() {
  const [region, setRegion] = useState("all");
  const [selection, setSelection] = useState<{ male: Selection | null; female: Selection | null }>({
    male: null,
    female: null,
  });
  const [notice, setNotice] = useState<string | null>(null);

  const visibleLofts = LOFTS.filter((l) => region === "all" || l.region === region);

  function selectBird(bird: Bird, loftName: string) {
    setSelection((prev) => ({ ...prev, [bird.sex]: { name: bird.name, meta: bird.meta, loft: loftName } }));
    setNotice(null);
  }

  function changeRegion(key: string) {
    setRegion(key);
    setSelection({ male: null, female: null });
    setNotice(null);
  }

  function reserve() {
    if (!selection.male || !selection.female) return;
    setNotice(
      `Pairing reserved: Sire "${selection.male.name}" (${selection.male.loft}) × Dam "${selection.female.name}" (${selection.female.loft}). Checkout isn't connected yet — a Stripe Payment Link is coming soon to take the $500 deposit.`
    );
  }

  const ready = Boolean(selection.male && selection.female);

  return (
    <>
      <section id="lofts" className={styles.loftsBand}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>Verified Lofts</h2>
            <p>Sample listings shown below — click any bird to add it to your pairing.</p>
          </div>

          <div className={styles.loftFilter}>
            {REGIONS.map((r) => (
              <button key={r.key} className={r.key === region ? styles.active : ""} onClick={() => changeRegion(r.key)}>
                {r.label}
              </button>
            ))}
          </div>

          <div className={styles.loftGrid}>
            {visibleLofts.map((loft) => (
              <div key={loft.id} className={styles.loftCard}>
                <div className={styles.loftCardHead}>
                  <div>
                    <h3>{loft.name}</h3>
                    <div className={styles.loc}>{loft.loc}</div>
                  </div>
                  <div className={styles.verifiedBadge}>
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8z" />
                    </svg>
                    Verified
                  </div>
                </div>
                <div className={styles.birdRow}>
                  {loft.birds.map((bird) => {
                    const isSelected = selection[bird.sex]?.name === bird.name && selection[bird.sex]?.loft === loft.name;
                    return (
                      <div
                        key={bird.id}
                        className={`${styles.birdChip} ${bird.sex === "female" ? styles.female : ""} ${isSelected ? styles.selected : ""}`}
                        onClick={() => selectBird(bird, loft.name)}
                      >
                        <div className={styles.check}>{isSelected ? "✓" : ""}</div>
                        <div className={styles.sexTag}>{bird.sex === "male" ? "M" : "F"}</div>
                        <PigeonIcon sex={bird.sex} className={styles.pigeonIcon} />
                        <div className={styles.bname}>{bird.name}</div>
                        <div className={styles.bmeta}>{bird.meta}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="match">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>Build Your Pairing</h2>
            <p>Your selections from the lofts above appear here. Need to start over? Just pick different birds.</p>
          </div>

          <div className={styles.builderGrid}>
            <div>
              <div className={styles.sectionHead} style={{ textAlign: "left", maxWidth: "none", marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.3rem" }}>Your Selection</h2>
                <p>
                  {ready
                    ? "Your pairing is ready. Review the certificate, then reserve with a deposit."
                    : "Scroll up and click a male and a female bird from any verified loft to begin."}
                </p>
              </div>
              <div>
                {selection.male && (
                  <p>
                    <strong style={{ color: "var(--gold-light)" }}>Sire:</strong> {selection.male.name} (
                    {selection.male.meta}) from {selection.male.loft}
                  </p>
                )}
                {selection.female && (
                  <p>
                    <strong style={{ color: "var(--gold-light)" }}>Dam:</strong> {selection.female.name} (
                    {selection.female.meta}) from {selection.female.loft}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.certificate}>
              <div className={`${styles.eyebrow} ${styles.certEyebrow}`}>Rollers Only</div>
              <h3>Pairing Certificate</h3>

              <div className={styles.certSlot}>
                <PigeonIcon sex="male" className={styles.pigeonIcon} />
                <div>
                  <div className={styles.label}>Sire (Male)</div>
                  <div className={selection.male ? styles.value : styles.valueEmpty}>
                    {selection.male ? `${selection.male.name} — ${selection.male.loft}` : "Not selected"}
                  </div>
                </div>
              </div>
              <div className={styles.certSlot}>
                <PigeonIcon sex="female" className={styles.pigeonIcon} />
                <div>
                  <div className={styles.label}>Dam (Female)</div>
                  <div className={selection.female ? styles.value : styles.valueEmpty}>
                    {selection.female ? `${selection.female.name} — ${selection.female.loft}` : "Not selected"}
                  </div>
                </div>
              </div>

              <div className={styles.certPrice}>
                <div className={styles.amt}>$500</div>
                <div className={styles.lbl}>Deposit to Reserve This Pairing</div>
                <div className={styles.certBalance}>+ $500 balance due when your bird is ready · $1,000 total</div>
              </div>

              <button className={styles.reserveBtn} disabled={!ready} onClick={reserve}>
                {ready ? "Reserve This Pairing — $500 Deposit" : "Select a Sire & Dam First"}
              </button>
              <div className={styles.certFine}>Deposit reserves the pairing · Balance due at delivery · Terms below</div>
              {notice && <div className={styles.reserveNotice}>{notice}</div>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
