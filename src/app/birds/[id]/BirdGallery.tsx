"use client";
import { useState } from "react";
import Image from "next/image";

export default function BirdGallery({
  photos,
  alt,
  isLive,
  dnaCertified,
  healthCertified,
  rollersOnlyCertified,
}: {
  photos: string[];
  alt: string;
  isLive: boolean;
  dnaCertified: boolean;
  healthCertified: boolean;
  rollersOnlyCertified: boolean;
}) {
  const [active, setActive] = useState(0);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ position: "relative", height: 520, background: "var(--void)", border: "0.5px solid var(--border)", borderRadius: 2, overflow: "hidden" }}>
        {isLive && (
          <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2, background: "rgba(255,50,50,0.9)", color: "#fff", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 2 }}>● Live Auction</div>
        )}
        <div style={{ display: "flex", gap: 8, position: "absolute", top: 16, right: 16, zIndex: 2 }}>
          {rollersOnlyCertified && (
            <span className="tag" style={{ fontSize: 9, background: "var(--gold)", color: "var(--black)", borderColor: "var(--gold)" }}>
              ★ Rollers Only Certified
            </span>
          )}
          {dnaCertified && <span className="tag" style={{ fontSize: 9 }}>DNA Cert</span>}
          {healthCertified && <span className="tag" style={{ fontSize: 9 }}>Health Cert</span>}
        </div>
        {photos[active] && <Image src={photos[active]} alt={alt} fill style={{ objectFit: "contain", objectPosition: "center" }} />}
      </div>

      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
          {photos.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                flexShrink: 0,
                background: "var(--void)",
                border: `0.5px solid ${i === active ? "var(--gold)" : "var(--border)"}`,
                borderRadius: 2,
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <Image src={url} alt={`${alt} photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
