export const GLOBAL_ROOM_ID = "00000000-0000-0000-0000-000000000001";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;
// Raw input cap before transcoding even starts — a browser-side ffmpeg pass
// on something bigger than this risks stalling the tab. The 25MB cap above
// applies to the final (already-safe or transcoded) file that gets sent.
export const MAX_VIDEO_INPUT_BYTES = 150 * 1024 * 1024;

export const TYPING_TIMEOUT_MS = 3000;
