"use client";

import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";

const PAGE_WIDTH = 480;
const PAGE_HEIGHT = 640;

// Scale chosen for how big the book actually renders on screen (maxWidth
// below is 720px) - not the PDF's native resolution. The old version used
// scale 2, which was overkill here and part of why rendering took so long.
const RENDER_SCALE = 1.4;

// Renders each PDF page to a canvas via pdfjs-dist, then feeds the resulting
// image data URLs into react-pageflip for the actual page-turn animation.
//
// IMPORTANT: pages are rendered one at a time and pushed into state as each
// one finishes, NOT awaited as a single Promise.all/for-loop-then-setState
// at the end. The previous version rendered every page before showing
// anything - on a real 48-page issue that meant 30s+ of a blank "Loading
// issue…" screen even after the source PDF was compressed from 128MB to
// 12MB, because the bottleneck was the per-page canvas render+encode loop
// itself, not file size. This version shows page 1 (and the cover) within
// a second or two and fills in the rest in the background, with a small
// per-page spinner for anything not rendered yet.
export default function MagazineFlipbook({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  const [pageImages, setPageImages] = useState<(string | null)[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
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
        if (cancelled) return;

        setNumPages(doc.numPages);
        setPageImages(new Array(doc.numPages).fill(null));

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          canvas.width = 0;
          canvas.height = 0; // release memory promptly on large issues
          if (cancelled) return;
          setPageImages((prev) => {
            const next = prev.slice();
            next[i - 1] = dataUrl;
            return next;
          });
        }
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

  if (!numPages) {
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
            {src ? (
              <img src={src} alt={`${title} — page ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
            ) : (
              <div style={{ color: "var(--muted)", fontSize: 11 }}>Loading page {i + 1}…</div>
            )}
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
          Page {pageIndex + 1} of {numPages}
        </span>
        <button
          onClick={() => flipRef.current?.pageFlip().flipNext()}
          disabled={pageIndex >= numPages - 1}
          className="btn-ghost"
          style={{ padding: "8px 20px", opacity: pageIndex >= numPages - 1 ? 0.4 : 1 }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
