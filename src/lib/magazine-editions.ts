// Vol. 1, Issue 1 print editions. Prices include shipping (no separate
// shipping line). Shared by the checkout server action and the buy form.
export const MAGAZINE_EDITIONS = {
  standard: { label: "Standard Edition", priceCents: 4500 },
  special: { label: "Special Edition", priceCents: 8000 },
} as const;

export type MagazineEdition = keyof typeof MAGAZINE_EDITIONS;
