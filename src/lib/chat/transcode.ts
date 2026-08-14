// Client-side video transcoding via ffmpeg.wasm — runs entirely in the
// browser, no server infrastructure needed. Only loaded when someone
// actually attaches a video in a format browsers can't reliably play
// (@ffmpeg/ffmpeg and its ~25MB wasm core are dynamically imported here,
// never bundled into the main app chunk).
//
// Uses the single-threaded ffmpeg-core build deliberately, not the
// multi-threaded one — that build needs SharedArrayBuffer, which requires
// site-wide COOP/COEP response headers. Adding those would risk breaking
// other cross-origin resources elsewhere on the site (Supabase storage
// images, fonts) for a feature only a fraction of chat messages use.
// Single-threaded is slower but has zero blast radius outside this file.
//
// The worker script (public/ffmpeg-worker/) is a verbatim copy of
// @ffmpeg/ffmpeg's own worker.js, self-hosted instead of imported from the
// package. Its module worker needs a runtime `import(coreURL)` (coreURL
// is a blob: URL created at runtime, so no bundler can know it ahead of
// time) — Turbopack doesn't leave unresolvable dynamic imports alone the
// way webpack does, it replaces them with a stub that throws at runtime.
// Serving the file untouched from /public sidesteps that entirely.

const WEB_SAFE_VIDEO_TYPES = ["video/mp4", "video/webm"];

export function needsTranscode(file: File) {
  return file.type.startsWith("video/") && !WEB_SAFE_VIDEO_TYPES.includes(file.type);
}

let ffmpegPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

// Exported so other callers (the archive remaster pipeline) share the same
// loaded-once ffmpeg instance instead of fetching the ~25MB core twice.
export async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        // Must be absolute — @ffmpeg/ffmpeg resolves this against
        // import.meta.url of its own (bundled) module, not the page, so a
        // root-relative path resolves against the wrong base.
        classWorkerURL: `${window.location.origin}/ffmpeg-worker/worker.js`,
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

// Duration is capped via -t rather than pre-checked, so any input format
// (however exotic) comes out both web-safe and within the chat's length
// limit in one pass. -maxrate/-bufsize bound worst-case output size
// predictably instead of leaving it to crf alone.
export async function transcodeToMp4(
  file: File,
  maxSeconds: number,
  onProgress?: (ratio: number) => void
): Promise<File> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const onProgressEvent = ({ progress }: { progress: number }) => {
    if (onProgress) onProgress(Math.max(0, Math.min(progress, 1)));
  };
  ffmpeg.on("progress", onProgressEvent);

  const inputName = "input" + (file.name.match(/\.[^.]+$/)?.[0] || ".bin");
  const outputName = "output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i", inputName,
      "-t", String(maxSeconds),
      "-vf", "scale='min(1280,iw)':-2",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "28",
      "-maxrate", "1500k",
      "-bufsize", "3000k",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    return new File([bytes as BlobPart], file.name.replace(/\.[^.]+$/, "") + ".mp4", { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onProgressEvent);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
