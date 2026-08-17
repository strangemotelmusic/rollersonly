const BIRD_FIELDS = "id, name, ring_number, sex, color, primary_photo_url, sire_id, dam_id";

export type PedigreeNode = {
  id: string;
  name: string | null;
  ring_number: string | null;
  sex: string | null;
  color: string | null;
  primary_photo_url: string | null;
  sire_id: string | null;
  dam_id: string | null;
  sire: PedigreeNode | null;
  dam: PedigreeNode | null;
};

function buildLevel(remaining: number): string {
  if (remaining <= 1) return BIRD_FIELDS;
  const child = buildLevel(remaining - 1);
  return `${BIRD_FIELDS}, sire:sire_id(${child}), dam:dam_id(${child})`;
}

/**
 * PostgREST nested-select string fetching `generations` total generations
 * (the subject counts as generation 1) in a single round trip. Uses bare
 * `sire_id`/`dam_id` embed names, not `birds!sire_id` — the `!`-qualified
 * form returns empty results for this self-referencing relationship, per
 * the existing convention in src/app/birds/[id]/page.tsx.
 */
export function buildPedigreeSelectQuery(generations: number): string {
  return buildLevel(Math.max(1, generations));
}

/**
 * Just the `sire:sire_id(...), dam:dam_id(...)` embed clauses (no root-level
 * BIRD_FIELDS), for splicing into a larger hand-written select string that
 * already declares its own root fields — e.g. src/app/birds/[id]/page.tsx.
 */
export function buildAncestorEmbedFields(generations: number): string {
  if (generations <= 1) return "";
  const child = buildLevel(generations - 1);
  return `sire:sire_id(${child}), dam:dam_id(${child})`;
}

export type PositionedNode = { node: PedigreeNode; generation: number; slot: number };

/** Flattens a tree into a list with binary-tree slot indices, for laying out a visual chart or PDF. */
export function flattenForLayout(root: PedigreeNode): PositionedNode[] {
  const out: PositionedNode[] = [];
  function walk(node: PedigreeNode | null, generation: number, slot: number) {
    if (!node) return;
    out.push({ node, generation, slot });
    walk(node.sire, generation + 1, slot * 2);
    walk(node.dam, generation + 1, slot * 2 + 1);
  }
  walk(root, 0, 0);
  return out;
}

export type SharedAncestor = { bird: PedigreeNode; sireSideDepth: number; damSideDepth: number };

function collectWithDepth(
  node: PedigreeNode | null | undefined,
  depth: number,
  acc: Map<string, { node: PedigreeNode; depth: number }>
) {
  if (!node) return acc;
  const existing = acc.get(node.id);
  if (!existing || depth < existing.depth) acc.set(node.id, { node, depth });
  collectWithDepth(node.sire, depth + 1, acc);
  collectWithDepth(node.dam, depth + 1, acc);
  return acc;
}

/**
 * Compares a candidate sire's ancestor tree against a candidate dam's ancestor
 * tree and returns any birds appearing in both — the inbreeding / shared-
 * ancestor warning shown in the breeding-pair picker. Sorted by combined
 * generation distance ascending, so the closest (most concerning) shared
 * ancestor is first.
 */
export function findSharedAncestors(sireTree: PedigreeNode | null, damTree: PedigreeNode | null): SharedAncestor[] {
  if (!sireTree || !damTree) return [];
  const sireSide = collectWithDepth(sireTree, 0, new Map());
  const damSide = collectWithDepth(damTree, 0, new Map());
  const shared: SharedAncestor[] = [];
  for (const [id, sireEntry] of sireSide) {
    const damEntry = damSide.get(id);
    if (damEntry) shared.push({ bird: sireEntry.node, sireSideDepth: sireEntry.depth, damSideDepth: damEntry.depth });
  }
  return shared.sort((a, b) => a.sireSideDepth + a.damSideDepth - (b.sireSideDepth + b.damSideDepth));
}

export function birdLabel(bird: Pick<PedigreeNode, "name" | "ring_number">): string {
  if (bird.name && bird.ring_number) return `${bird.name} (${bird.ring_number})`;
  return bird.name || bird.ring_number || "Unknown";
}
