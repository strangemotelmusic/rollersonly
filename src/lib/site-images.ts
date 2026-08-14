import { createAdminClient } from "@/lib/supabase/admin";

// Each key corresponds to one placeholder bird photo, wherever it's reused
// across the homepage - replacing a slot here updates every spot that photo
// appears, since the original static files were reused across sections.
export const SITE_IMAGE_SLOTS = [
  { key: "hero", label: "Homepage Hero Image", defaultUrl: "/hero-bird.png" },
  { key: "bird_white_red", label: "Blue Bar Champion Cock (homepage featured grid)", defaultUrl: "/bird-white-red.jpg" },
  { key: "bird_red", label: "Red Self Breeding Hen (homepage featured grid)", defaultUrl: "/bird-red.jpg" },
  { key: "bird_lavender", label: "White Badge Breeding Pair (homepage featured grid + CTA)", defaultUrl: "/bird-lavender.jpg" },
  { key: "bird_white_red2", label: "White Badge Roller Hen (homepage featured grid)", defaultUrl: "/bird-white-red2.jpg" },
  { key: "bird_black_centertail", label: "Black Centertail Young Cock (homepage featured grid + platform pillars)", defaultUrl: "/bird-black-centertail.jpg" },
  { key: "bird_red2", label: "Recessive Red Breeding Hen (homepage featured grid + CTA)", defaultUrl: "/bird-red2.jpg" },
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_SLOTS)[number]["key"];

export async function getSiteImages(): Promise<Record<SiteImageKey, string>> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_images").select("key, url");

  const overrides = new Map((data ?? []).map((row) => [row.key, row.url]));
  const result = {} as Record<SiteImageKey, string>;
  for (const slot of SITE_IMAGE_SLOTS) {
    result[slot.key] = overrides.get(slot.key) ?? slot.defaultUrl;
  }
  return result;
}

export async function getSiteImageMeta(): Promise<Record<SiteImageKey, { label: string; url: string }>> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_images").select("key, label, url");

  const overrides = new Map((data ?? []).map((row) => [row.key, row]));
  const result = {} as Record<SiteImageKey, { label: string; url: string }>;
  for (const slot of SITE_IMAGE_SLOTS) {
    const row = overrides.get(slot.key);
    result[slot.key] = { label: row?.label ?? slot.label, url: row?.url ?? slot.defaultUrl };
  }
  return result;
}
