// Automatic "remastering" for old archive photos and videos — classical,
// deterministic enhancement (auto-levels, denoise, sharpen), not an AI
// model. A true learned super-resolution/restoration model is out of reach
// running client-side in a browser tab; this is the well-understood
// classical toolkit (contrast stretch, unsharp mask, temporal/spatial
// denoise) that gets old faded/grainy footage most of the way there,
// entirely offline, with no server-side processing.

import { getFFmpeg } from "@/lib/chat/transcode";

// ---------- Photos: Canvas 2D pixel pipeline ----------

const MAX_ENHANCE_DIM = 2400;

export async function enhanceImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_ENHANCE_DIM / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  autoLevels(data);
  boostSaturation(data, 1.15);
  unsharpMask(data, width, height, 1, 0.5);

  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-remastered.jpg", { type: "image/jpeg" });
}

function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Contrast-stretches each channel to the full 0-255 range using the 0.5th
// and 99.5th percentiles (not the raw min/max) so a handful of stray
// bright/dark pixels can't defeat the stretch — exactly what old faded or
// yellowed photos need to look "restored."
function autoLevels(data: Uint8ClampedArray) {
  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);
  let sampled = 0;
  for (let i = 0; i < data.length; i += 16) {
    histR[data[i]]++;
    histG[data[i + 1]]++;
    histB[data[i + 2]]++;
    sampled++;
  }
  const clip = sampled * 0.005;
  const [rLow, rHigh] = findPercentiles(histR, clip);
  const [gLow, gHigh] = findPercentiles(histG, clip);
  const [bLow, bHigh] = findPercentiles(histB, clip);

  const rScale = 255 / Math.max(1, rHigh - rLow);
  const gScale = 255 / Math.max(1, gHigh - gLow);
  const bScale = 255 / Math.max(1, bHigh - bLow);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clampByte((data[i] - rLow) * rScale);
    data[i + 1] = clampByte((data[i + 1] - gLow) * gScale);
    data[i + 2] = clampByte((data[i + 2] - bLow) * bScale);
  }
}

function findPercentiles(hist: Uint32Array, clip: number): [number, number] {
  let low = 0;
  let high = 255;
  let count = 0;
  for (let i = 0; i < 256; i++) {
    count += hist[i];
    if (count > clip) {
      low = i;
      break;
    }
  }
  count = 0;
  for (let i = 255; i >= 0; i--) {
    count += hist[i];
    if (count > clip) {
      high = i;
      break;
    }
  }
  if (high <= low) return [0, 255];
  return [low, high];
}

function boostSaturation(data: Uint8ClampedArray, factor: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = clampByte(lum + (r - lum) * factor);
    data[i + 1] = clampByte(lum + (g - lum) * factor);
    data[i + 2] = clampByte(lum + (b - lum) * factor);
  }
}

// Classic unsharp mask: blur a copy, then push each pixel further away from
// its blurred value. Recovers perceived detail that denoising (video) or
// old-photo softness tends to hide.
function unsharpMask(data: Uint8ClampedArray, width: number, height: number, radius: number, amount: number) {
  const blurred = separableBoxBlur(data, width, height, radius);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clampByte(data[i] + (data[i] - blurred[i]) * amount);
    data[i + 1] = clampByte(data[i + 1] + (data[i + 1] - blurred[i + 1]) * amount);
    data[i + 2] = clampByte(data[i + 2] + (data[i + 2] - blurred[i + 2]) * amount);
  }
}

function separableBoxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Float32Array {
  const temp = new Float32Array(data.length);
  const out = new Float32Array(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const sx = x + dx;
        if (sx < 0 || sx >= width) continue;
        const idx = (y * width + sx) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
      const idx = (y * width + x) * 4;
      temp[idx] = r / count;
      temp[idx + 1] = g / count;
      temp[idx + 2] = b / count;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const sy = y + dy;
        if (sy < 0 || sy >= height) continue;
        const idx = (sy * width + x) * 4;
        r += temp[idx];
        g += temp[idx + 1];
        b += temp[idx + 2];
        count++;
      }
      const idx = (y * width + x) * 4;
      out[idx] = r / count;
      out[idx + 1] = g / count;
      out[idx + 2] = b / count;
    }
  }
  return out;
}

// ---------- Videos: ffmpeg.wasm filter chain ----------

// Always re-encodes, even if the source is already an MP4 — unlike chat's
// transcodeToMp4 (which skips already-safe files to keep messages snappy),
// the whole point here is to apply the filter chain to every archive video.
export async function remasterVideo(
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

  // hqdn3d: denoise old/grainy footage (spatial+temporal). eq: lift faded
  // contrast/saturation/gamma back up. unsharp: recover detail denoising
  // softens. Order matters — denoise first so unsharp doesn't re-sharpen
  // the noise it just removed.
  const filterChain = [
    "scale='min(1920,iw)':-2",
    "hqdn3d=3:3:4:4",
    "eq=contrast=1.08:saturation=1.2:gamma=1.03",
    "unsharp=5:5:0.6:5:5:0.3",
  ].join(",");

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i", inputName,
      "-t", String(maxSeconds),
      "-vf", filterChain,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    return new File([bytes as BlobPart], file.name.replace(/\.[^.]+$/, "") + "-remastered.mp4", { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onProgressEvent);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
