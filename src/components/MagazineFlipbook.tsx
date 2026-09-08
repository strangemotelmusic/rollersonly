"use client";

// Previously rendered every page to a canvas via pdfjs-dist for a custom
// page-flip animation - broke down on a real 48-page issue because it
// awaited a canvas render for all N pages before showing anything, with no
// progress UI and no lazy loading. Confirmed hanging 30s+ on a real issue
// even after cutting the source PDF from 128MB to 12MB, so the bottleneck
// was the per-page canvas render loop itself, not file size. Swapped to the
// browser's own native PDF renderer (fast, handles any page count, already
// battle-tested) at the cost of the page-flip animation. Revisit a proper
// lazy/progressive canvas renderer later if the flip UX is worth rebuilding.
export default function MagazineFlipbook({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <iframe
        src={pdfUrl}
        title={title}
        style={{
          width: "100%",
          maxWidth: 900,
          height: "80vh",
          minHeight: 500,
          border: "0.5px solid var(--border)",
          background: "#111",
        }}
      />
      <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: "8px 20px" }}>
        Open in New Tab ↗
      </a>
    </div>
  );
}
