// Only breeder and elite subscribers get full magazine access - fancier
// does not include it. Kept as a single source of truth since the gate is
// checked from three different pages (index, single issue, homepage CTA).
export function hasMagazineAccess(tier: string | null | undefined): boolean {
  return tier === "breeder" || tier === "elite";
}

const SAMPLE_EXCERPT_CHARS = 600;

export function excerptContent(content: string | null): { text: string; truncated: boolean } {
  if (!content) return { text: "", truncated: false };
  if (content.length <= SAMPLE_EXCERPT_CHARS) return { text: content, truncated: false };

  // Cut at the nearest paragraph/sentence boundary before the limit so the
  // sample doesn't end mid-word.
  const slice = content.slice(0, SAMPLE_EXCERPT_CHARS);
  const lastBreak = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(". "));
  const cut = lastBreak > SAMPLE_EXCERPT_CHARS * 0.5 ? lastBreak + 1 : SAMPLE_EXCERPT_CHARS;
  return { text: content.slice(0, cut).trim(), truncated: true };
}
