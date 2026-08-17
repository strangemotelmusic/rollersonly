export type PhotoCropSettings = { x: number; y: number; zoom: number };

export type PhotoSettingsMap = Record<string, PhotoCropSettings>;

export const DEFAULT_CROP: PhotoCropSettings = { x: 50, y: 50, zoom: 1 };

export function asPhotoSettingsMap(value: unknown): PhotoSettingsMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PhotoSettingsMap;
}

export function cropFor(settings: PhotoSettingsMap | null | undefined, url: string): PhotoCropSettings {
  const s = settings?.[url];
  if (!s) return DEFAULT_CROP;
  return {
    x: typeof s.x === "number" ? s.x : DEFAULT_CROP.x,
    y: typeof s.y === "number" ? s.y : DEFAULT_CROP.y,
    zoom: typeof s.zoom === "number" ? s.zoom : DEFAULT_CROP.zoom,
  };
}

export function cropImageStyle(crop: PhotoCropSettings): React.CSSProperties {
  return {
    objectFit: "cover",
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: crop.zoom !== 1 ? `scale(${crop.zoom})` : undefined,
  };
}
