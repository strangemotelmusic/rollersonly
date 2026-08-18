"use server";

import { createClient } from "@/lib/supabase/server";

export type ImportNode = {
  name: string | null;
  ringNumber: string | null;
  sex: "cock" | "hen" | null;
  color: string | null;
  sire: ImportNode | null;
  dam: ImportNode | null;
};

async function requireUser(): Promise<{ error: string } | { userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  return { userId: user.id };
}

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BASE64_LENGTH = 15_000_000; // ~11MB raw

const EXTRACTION_PROMPT = `You are reading a roller pigeon pedigree chart from a photo or screenshot. Extract every bird you can identify into a strict JSON tree matching this recursive schema:

{"name": string|null, "ringNumber": string|null, "sex": "cock"|"hen"|null, "color": string|null, "sire": <same shape>|null, "dam": <same shape>|null}

The root of the tree is the main/featured bird on the chart. "sire" is its father's side of the pedigree, "dam" is its mother's side, and each of those can themselves have a sire/dam going back further generations if the chart shows them.

Standard pedigree charts consistently place the sire (father, always male) above the dam (mother, always female) within each parent pair — top-half of a generation is the sire's line, bottom-half is the dam's line (a few charts instead use left=sire/right=dam; use whichever spatial convention is visually consistent across the whole chart). Use this position, plus any explicit labels (Sire/Dam, S/D, Cock/Hen, ♂/♀), to correctly assign each bird to the sire or dam branch at every generation — this matters more than the "sex" field below, since branch position is how the tree gets rebuilt correctly.

Ring/band numbers are usually a mix of letters and numbers (e.g. club prefix + year + sequence number). Leave any field null if it is not legible or not present. If a branch of the tree is not shown in the image (chart ends early for that line), set it to null rather than guessing. Respond with ONLY the raw JSON object — no markdown code fences, no other text.`;

type AnthropicContentBlock = { type: string; text?: string };
type AnthropicResponse = { content?: AnthropicContentBlock[] };

function isValidNode(value: unknown): value is ImportNode {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const strOrNull = (x: unknown) => x === null || typeof x === "string";
  if (!strOrNull(v.name) || !strOrNull(v.ringNumber) || !strOrNull(v.color)) return false;
  if (v.sex !== null && v.sex !== "cock" && v.sex !== "hen") return false;
  if (v.sire !== undefined && v.sire !== null && !isValidNode(v.sire)) return false;
  if (v.dam !== undefined && v.dam !== null && !isValidNode(v.dam)) return false;
  return true;
}

export async function extractPedigreeFromImage(base64: string, mediaType: string): Promise<{ error: string } | { tree: ImportNode }> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) return { error: "Upload a JPEG, PNG, WEBP, or GIF image." };
  if (base64.length > MAX_BASE64_LENGTH) return { error: "That image is too large — try a smaller file." };
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Pedigree photo import isn't set up yet — contact the site owner." };

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    });
  } catch {
    return { error: "Could not reach the image reader — try again in a moment." };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `Could not read the pedigree image (${res.status}). ${text.slice(0, 200)}` };
  }

  const data: AnthropicResponse = await res.json();
  const textBlock = data.content?.find((b) => b.type === "text")?.text;
  if (!textBlock) return { error: "The image reader returned an unexpected response." };

  let parsed: unknown;
  try {
    const cleaned = textBlock
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { error: "Could not understand the pedigree in that image — try a clearer photo." };
  }

  if (!isValidNode(parsed)) return { error: "Could not understand the pedigree in that image — try a clearer photo." };
  return { tree: normalizeSexByPosition(parsed, null) };
}

// Every bird reached via a "sire" edge is definitionally a cock and every bird
// reached via a "dam" edge is definitionally a hen, regardless of generation —
// this is exact from tree position alone, so it's more reliable than asking
// the model to read sex off the image (which it often can't see at all).
// Only the root bird's sex is left as whatever the model read.
function normalizeSexByPosition(node: ImportNode, forcedSex: "cock" | "hen" | null): ImportNode {
  return {
    ...node,
    sex: forcedSex ?? node.sex,
    sire: node.sire ? normalizeSexByPosition(node.sire, "cock") : null,
    dam: node.dam ? normalizeSexByPosition(node.dam, "hen") : null,
  };
}
