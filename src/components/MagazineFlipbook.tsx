"use client";

import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";

const PAGE_WIDTH = 480;
const PAGE_HEIGHT = 640;

// Renders each PDF page to a canvas via pdfjs-dist, then feeds the resulting
// image data URLs into react-pageflip for the actual page-turn animation.
// pdfjs-dist only runs client-side (it touches canvas/worker APIs), so this
// whole component is "use client" and does all rendering in an effect.
export default function MagazineFlipbook({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  const [pageImages, setPageImages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flipRef = useRef<any>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const doc = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        const images: string[] = [];

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          images.push(canvas.toDataURL("image/jpeg", 0.85));
        }

        if (!cancelled) setPageImages(images);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this issue.");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p style={{ color: "#e8a3a3", fontSize: 14, marginBottom: 16 }}>{error}</p>
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-gold" style={{ padding: "10px 24px", display: "inline-block" }}>
          Open PDF Directly
        </a>
      </div>
    );
  }

  if (!pageImages) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
        Loading issue…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <HTMLFlipBook
        ref={flipRef}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        size="stretch"
        minWidth={280}
        maxWidth={720}
        minHeight={380}
        maxHeight={960}
        startPage={0}
        drawShadow
        flippingTime={600}
        usePortrait
        startZIndex={0}
        autoSize
        maxShadowOpacity={0.5}
        showCover
        mobileScrollSupport
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        className="magazine-flipbook"
        style={{}}
        onFlip={(e: any) => setPageIndex(e.data)}
      >
        {pageImages.map((src, i) => (
          <div key={i} style={{ background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={src} alt={`${title} — page ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
          </div>
        ))}
      </HTMLFlipBook>

      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 24 }}>
        <button
          onClick={() => flipRef.current?.pageFlip().flipPrev()}
          disabled={pageIndex === 0}
          className="btn-ghost"
          style={{ padding: "8px 20px", opacity: pageIndex === 0 ? 0.4 : 1 }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Page {pageIndex + 1} of {pageImages.length}
        </span>
        <button
          onClick={() => flipRef.current?.pageFlip().flipNext()}
          disabled={pageIndex >= pageImages.length - 1}
          className="btn-ghost"
          style={{ padding: "8px 20px", opacity: pageIndex >= pageImages.length - 1 ? 0.4 : 1 }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
