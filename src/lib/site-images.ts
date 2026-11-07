import { createAdminClient } from "@/lib/supabase/admin";

// Each key corresponds to one placeholder bird photo, wherever it's reused
// across the homepage - replacing a slot here updates every spot that photo
// appears, since the original static files were reused across sections.
export const SITE_IMAGE_SLOTS = [
  { key: "hero", label: "Homepage Hero Image", defaultUrl: "/hero-bird.png" },
  { key: "logo", label: "Site logo / brand mark (every page header)", defaultUrl: "/ro-seal.png" },
  { key: "bird_lavender", label: "White Badge Breeding Pair (homepage CTA)", defaultUrl: "/bird-lavender.jpg" },
  { key: "bird_black_centertail", label: "Black Centertail Young Cock (homepage digital-loft preview)", defaultUrl: "/bird-black-centertail.jpg" },
  { key: "bird_red2", label: "Recessive Red Breeding Hen (homepage CTA)", defaultUrl: "/bird-red2.jpg" },
  { key: "mag_cover_small", label: "Decade of the Spinner cover (homepage ecosystem section)", defaultUrl: "/decade-of-the-spinner-cover.jpg" },
  { key: "community_photo", label: "Community / trophy photo (homepage community section)", defaultUrl: "/decade-of-the-spinner/trophy.jpg" },
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
