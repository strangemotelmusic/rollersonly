"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { createMatchmakingReservation } from "@/app/actions/matchmaking";

type Sex = "cock" | "hen";
export type Bird = { id: string; name: string; sex: Sex; meta: string };
export type Loft = { id: string; name: string; loc: string; birds: Bird[] };
type Selection = { id: string; name: string; meta: string; loft: string };

function PigeonIcon({ sex, className }: { sex: Sex; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100">
      <path
        style={{ fill: sex === "cock" ? "var(--gold)" : "var(--maroon-light)" }}
        d="M50 12c-4 0-7 3-7 7 0 2 1 4 2 5-10 3-18 11-21 21-1 3-3 5-6 6-2 1-2 3 0 4 3 1 6 0 8-2 1 4 3 8 6 11-2 1-4 3-5 5-1 2 1 4 3 3 3-1 5-3 7-6 3 2 7 3 11 3s8-1 11-3c2 3 4 5 7 6 2 1 4-1 3-3-1-2-3-4-5-5 3-3 5-7 6-11 2 2 5 3 8 2 2-1 2-3 0-4-3-1-5-3-6-6-3-10-11-18-21-21 1-1 2-3 2-5 0-4-3-7-7-7z"
      />
    </svg>
  );
}

export default function MatchBuilder({ lofts }: { lofts: Loft[] }) {
  const [selection, setSelection] = useState<{ cock: Selection | null; hen: Selection | null }>({
    cock: null,
    hen: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);

  function selectBird(bird: Bird, loftName: string) {
    setSelection((prev) => ({ ...prev, [bird.sex]: { id: bird.id, name: bird.name, meta: bird.meta, loft: loftName } }));
    setError(null);
  }

  async function reserve() {
    if (!selection.cock || !selection.hen) return;
    setReserving(true);
    setError(null);
    const result = await createMatchmakingReservation(selection.cock.id, selection.hen.id);
    setReserving(false);
    if (result?.error) setError(result.error);
  }

  const ready = Boolean(selection.cock && selection.hen);

  return (
    <>
      <section id="lofts" className={styles.loftsBand}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.rule}></div>
            <h2>Verified Lofts</h2>
            <p>Real birds listed by verified breeders — click any bird to add it to your pairing.</p>
          </div>

          {lofts.length === 0 ? (
            <p style={{ textAlign: "center", opacity: 0.75 }}>
              No birds are listed for matchmaking yet — check back soon, or if you&apos;re a breeder, list one of
              yours from your loft dashboard.
            </p>
          ) : (
            <div className={styles.loftGrid}>
              {lofts.map((loft) => (
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
                      const isSelected = selection[bird.sex]?.id === bird.id;
                      return (
                        <div
                          key={bird.id}
                          className={`${styles.birdChip} ${bird.sex === "hen" ? styles.female : ""} ${isSelected ? styles.selected : ""}`}
                          onClick={() => selectBird(bird, loft.name)}
                        >
                          <div className={styles.check}>{isSelected ? "✓" : ""}</div>
                          <div className={styles.sexTag}>{bird.sex === "cock" ? "M" : "F"}</div>
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
          )}
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
                {selection.cock && (
                  <p>
                    <strong style={{ color: "var(--gold-light)" }}>Sire:</strong> {selection.cock.name} (
                    {selection.cock.meta}) from {selection.cock.loft}
                  </p>
                )}
                {selection.hen && (
                  <p>
                    <strong style={{ color: "var(--gold-light)" }}>Dam:</strong> {selection.hen.name} (
                    {selection.hen.meta}) from {selection.hen.loft}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.certificate}>
              <div className={`${styles.eyebrow} ${styles.certEyebrow}`}>Rollers Only</div>
              <h3>Pairing Certificate</h3>

              <div className={styles.certSlot}>
                <PigeonIcon sex="cock" className={styles.pigeonIcon} />
                <div>
                  <div className={styles.label}>Sire (Male)</div>
                  <div className={selection.cock ? styles.value : styles.valueEmpty}>
                    {selection.cock ? `${selection.cock.name} — ${selection.cock.loft}` : "Not selected"}
                  </div>
                </div>
              </div>
              <div className={styles.certSlot}>
                <PigeonIcon sex="hen" className={styles.pigeonIcon} />
                <div>
                  <div className={styles.label}>Dam (Female)</div>
                  <div className={selection.hen ? styles.value : styles.valueEmpty}>
                    {selection.hen ? `${selection.hen.name} — ${selection.hen.loft}` : "Not selected"}
                  </div>
                </div>
              </div>

              <div className={styles.certPrice}>
                <div className={styles.amt}>$500</div>
                <div className={styles.lbl}>Deposit to Reserve This Pairing</div>
                <div className={styles.certBalance}>+ $500 balance due when your bird is ready · $1,000 total</div>
              </div>

              <button className={styles.reserveBtn} disabled={!ready || reserving} onClick={reserve}>
                {reserving ? "Starting checkout…" : ready ? "Reserve This Pairing — $500 Deposit" : "Select a Sire & Dam First"}
              </button>
              <div className={styles.certFine}>Deposit reserves the pairing · Balance due at delivery · Terms below</div>
              {error && <div className={styles.reserveNotice}>{error}</div>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
