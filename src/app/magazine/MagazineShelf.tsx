"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MagazineFlipbook from "@/components/MagazineFlipbook";

type ShelfIssue = {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
};

// Always show at least this many reader slots; unpublished ones read "Coming soon".
// Once more issues than this are published, every issue gets a slot.
const MIN_SLOTS = 4;

export default function MagazineShelf({ issues }: { issues: ShelfIssue[] }) {
  const sorted = [...issues].sort((a, b) => a.issue_number - b.issue_number);
  const [selectedId, setSelectedId] = useState<string | null>(
    sorted.length ? sorted[sorted.length - 1].id : null
  );
  const selected = sorted.find((i) => i.id === selectedId) ?? null;

  const highest = sorted.length ? sorted[sorted.length - 1].issue_number : 0;
  const placeholders = Array.from({ length: Math.max(MIN_SLOTS - sorted.length, 0) }, (_, i) => highest + i + 1);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Issues"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16, marginBottom: 40 }}
      >
        {sorted.map((issue) => {
          const active = issue.id === selectedId;
          return (
            <button
              key={issue.id}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(issue.id)}
              style={{
                textAlign: "left",
                padding: 0,
                cursor: "pointer",
                background: "var(--surface)",
                border: active ? "1.5px solid var(--gold)" : "0.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                boxShadow: active ? "0 0 0 3px rgba(201,162,75,0.15)" : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{ position: "relative", aspectRatio: "3 / 4", background: "var(--void)" }}>
                {issue.cover_image_url && (
                  <Image src={issue.cover_image_url} alt={issue.title} fill sizes="200px" style={{ objectFit: "cover" }} />
                )}
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>
                  Issue #{issue.issue_number}
                </div>
                <div style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.3 }}>{issue.title}</div>
              </div>
            </button>
          );
        })}
        {placeholders.map((n) => (
          <div
            key={`soon-${n}`}
            aria-disabled
            style={{
              border: "0.5px dashed var(--border)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              opacity: 0.6,
            }}
          >
            <div
              style={{
                aspectRatio: "3 / 4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--ff-display)",
                fontSize: 40,
                fontWeight: 300,
                color: "var(--muted)",
              }}
            >
              {n}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                Issue #{n}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Coming soon</div>
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <section aria-live="polite">
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
            Now reading — Issue #{selected.issue_number}
          </div>
          <h2 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
            {selected.title}
          </h2>
          {selected.description && (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620, marginBottom: 28 }}>{selected.description}</p>
          )}
          {selected.pdf_url ? (
            <div style={{ maxWidth: 900 }}>
              {/* key forces a fresh render when switching issues */}
              <MagazineFlipbook key={selected.id} pdfUrl={selected.pdf_url} title={selected.title} />
            </div>
          ) : (
            <Link href={`/magazine/${selected.id}`} className="btn-gold" style={{ padding: "12px 28px" }}>
              Read this issue →
            </Link>
          )}
        </section>
      ) : (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>No issues published yet — check back soon.</p>
      )}
    </div>
  );
}
