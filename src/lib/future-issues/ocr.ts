import type { Worker } from "tesseract.js";

// A small pool of lazily-created Tesseract workers, reused across a whole
// batch — a single worker processes recognize() calls one at a time, so a
// pool lets several covers get OCR'd concurrently instead of queueing
// behind each other. The ~few-MB engine/lang download happens once per
// worker, on first use, in the browser. No server or API key involved (same
// client-side-heavy pattern as the video transcoder). Kept out of the main
// bundle via dynamic import.
const POOL_SIZE = 3;
let workerPoolPromise: Promise<Worker[]> | null = null;
let nextWorkerIndex = 0;

async function getWorkerPool(): Promise<Worker[]> {
  if (!workerPoolPromise) {
    workerPoolPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      return Promise.all(Array.from({ length: POOL_SIZE }, () => createWorker("eng")));
    })();
  }
  return workerPoolPromise;
}

async function getWorker(): Promise<Worker> {
  const pool = await getWorkerPool();
  const worker = pool[nextWorkerIndex % pool.length];
  nextWorkerIndex += 1;
  return worker;
}

export type CoverInfo = { title: string; releaseLabel: string };

const SEASON_RE = /\b(spring|summer|fall|autumn|winter)\s+((?:19|20)\d{2}|'\d{2})\b/i;
const ISSUE_RE = /\bissue\s*#?\s*\d+\b/i;
const YEAR_RE = /\b(?:19|20)\d{2}\b/;

// Text printed on essentially every Decade of the Spinner cover — never the
// actual headline, so it's skipped when guessing the title.
const BOILERPLATE = [
  /decade of the spinner/i,
  /collector'?s edition/i,
  /championship issue/i,
  /the world is our backyard/i,
  /brotherhood/i,
  /\bd\.?o\.?t\.?s\.?\b/i,
  /presents/i,
];

// OCR a cover image and pull out a best-guess title + release label.
export async function extractCoverInfo(file: File): Promise<CoverInfo> {
  const worker = await getWorker();
  const { data } = await worker.recognize(file);
  return parseCoverText(data.text || "");
}

export function parseCoverText(text: string): CoverInfo {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  let releaseLabel = "";
  for (const l of lines) {
    const m = l.match(SEASON_RE) || l.match(ISSUE_RE);
    if (m) {
      releaseLabel = tidy(m[0]);
      break;
    }
  }
  if (!releaseLabel) {
    for (const l of lines) {
      const m = l.match(YEAR_RE);
      if (m) {
        releaseLabel = m[0];
        break;
      }
    }
  }

  const candidates = lines.filter((l) => {
    if (BOILERPLATE.some((re) => re.test(l))) return false;
    if (releaseLabel && l.toLowerCase().includes(releaseLabel.toLowerCase())) return false;
    return /[a-z]/i.test(l) && l.replace(/[^a-z]/gi, "").length >= 4;
  });

  const top = candidates.slice(0, 8).sort((a, b) => scoreTitle(b) - scoreTitle(a));
  const title = top.length ? tidy(top[0]) : "";

  return { title, releaseLabel };
}

// Favour longer, mostly-uppercase lines — magazine headlines are set big and
// in caps, so they win over incidental small print.
function scoreTitle(l: string): number {
  const letters = l.replace(/[^a-z]/gi, "").length;
  const uppers = l.replace(/[^A-Z]/g, "").length;
  const upperRatio = uppers / Math.max(1, letters);
  return letters + upperRatio * 12;
}

function tidy(s: string): string {
  const cleaned = s.replace(/\s+/g, " ").trim();
  // OCR of a headline is usually ALL CAPS — convert to Title Case for display.
  if (cleaned === cleaned.toUpperCase()) {
    return cleaned.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return cleaned;
}

// Fallback used when OCR is unavailable or reads nothing usable: derive a
// title from the file name (e.g. "spring-2027_bloodlines.jpg" → "Spring 2027
// Bloodlines"), and pull a release label out of it if one is present.
export function infoFromFilename(name: string): CoverInfo {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const seasonMatch = base.match(SEASON_RE) || base.match(YEAR_RE);
  return {
    title: base.replace(/\b\w/g, (c) => c.toUpperCase()),
    releaseLabel: seasonMatch ? tidy(seasonMatch[0]) : "",
  };
}
