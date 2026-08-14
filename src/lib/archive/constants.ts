export const MAX_ARCHIVE_IMAGE_BYTES = 15 * 1024 * 1024;
export const ALLOWED_ARCHIVE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Archive videos are old footage that can run much longer than a chat
// clip — generous caps since only the admin uploads here.
export const MAX_ARCHIVE_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_ARCHIVE_VIDEO_SECONDS = 20 * 60;
// Raw input cap before client-side transcoding even starts — a browser-side
// ffmpeg pass beyond this risks stalling the tab.
export const MAX_ARCHIVE_VIDEO_INPUT_BYTES = 300 * 1024 * 1024;
