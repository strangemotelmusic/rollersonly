"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Breeder = {
  id: string;
  name: string;
  sex: string | null;
  color: string | null;
  bloodline: string | null;
  ring_number: string | null;
  flying_record: string | null;
  loft_record: string | null;
  bio: string | null;
  photo_urls: string[];
};

export default function OurBreedersClient({ breeders }: { breeders: Breeder[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const active = activeIndex !== null ? breeders[activeIndex] : null;

  function open(i: number) {
    setActiveIndex(i);
    setPhotoIndex(0);
  }

  function close() {
    setActiveIndex(null);
  }

  function nextBreeder() {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % breeders.length);
    setPhotoIndex(0);
  }

  function prevBreeder() {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + breeders.length) % breeders.length);
    setPhotoIndex(0);
  }

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && active) setPhotoIndex((p) => (p + 1) % Math.max(1, active.photo_urls.length));
      if (e.key === "ArrowLeft" && active) setPhotoIndex((p) => (p - 1 + Math.max(1, active.photo_urls.length)) % Math.max(1, active.photo_urls.length));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, active]);

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      <div style={{ background: "var(--void)", padding: "72px 64px 56px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
          Decade of the Spinner
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 700 }}>
          Our <em style={{ color: "var(--gold)" }}>Breeders</em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620 }}>
          The foundation birds behind every bloodline on RollersOnly — the champions, sires, and dams that produce the
          birds you see for sale on the site. Their record in the air, and in the loft.
        </p>
      </div>

      <div style={{ padding: "48px 64px 96px" }}>
        {breeders.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>No breeders posted yet — check back soon.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {breeders.map((b, i) => (
              <button
                key={b.id}
                onClick={() => open(i)}
                style={{
                  background: "var(--surface)",
                  border: "0.5px solid var(--border)",
                  borderRadius: 2,
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: "var(--void)" }}>
                  {b.photo_urls[0] && <Image src={b.photo_urls[0]} alt={b.name} fill style={{ objectFit: "cover" }} />}
                  {b.photo_urls.length > 1 && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, fontSize: 10, fontWeight: 600, color: "var(--white)", background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 20 }}>
                      +{b.photo_urls.length - 1}
                    </span>
                  )}
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {[b.color, b.bloodline].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}
          onClick={close}
        >
          <button
            onClick={close}
            style={{ position: "absolute", top: 24, right: 32, background: "none", border: "none", color: "var(--white)", fontSize: 28, cursor: "pointer" }}
          >
            ✕
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 0, maxWidth: 1100, width: "100%", maxHeight: "88vh", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden" }}
          >
            {/* PHOTO */}
            <div style={{ position: "relative", background: "#000" }}>
              {active.photo_urls.length > 0 ? (
                <Image src={active.photo_urls[photoIndex]} alt={active.name} fill style={{ objectFit: "contain" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", fontSize: 13 }}>No photos yet</div>
              )}
              {active.photo_urls.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((p) => (p - 1 + active.photo_urls.length) % active.photo_urls.length)}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "var(--white)", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setPhotoIndex((p) => (p + 1) % active.photo_urls.length)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "var(--white)", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}
                  >
                    ›
                  </button>
                  <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "var(--white)" }}>
                    {photoIndex + 1} / {active.photo_urls.length}
                  </div>
                </>
              )}
            </div>

            {/* DETAILS */}
            <div style={{ padding: 32, overflowY: "auto" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 6 }}>{active.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
                {[active.sex, active.color, active.bloodline, active.ring_number].filter(Boolean).join(" · ") || "—"}
              </div>

              {active.flying_record && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>In the Air</div>
                  <p style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{active.flying_record}</p>
                </div>
              )}

              {active.loft_record && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>In the Loft</div>
                  <p style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{active.loft_record}</p>
                </div>
              )}

              {active.bio && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>About</div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{active.bio}</p>
                </div>
              )}

              {breeders.length > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "0.5px solid var(--border)", paddingTop: 20 }}>
                  <button onClick={prevBreeder} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer" }}>← Previous</button>
                  <button onClick={nextBreeder} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer" }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
