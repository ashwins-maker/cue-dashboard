// Assembles nudge content from store-owned sources only (F-2.1). No invented facts,
// no external benchmarks. Copy rules (PRD §06): answer <140 chars, resolution first,
// never reference the shopper's behaviour back at them, say the honest thing even when
// it hurts the sale.

import { RETURNS_POLICY, type DenimProduct } from "./demo-catalog";
import type { HesitationType, NudgeContent, Surface } from "./types";

const MAX_ANSWER_LEN = 140;

function assertAnswerLength(answer: string): string {
  if (answer.length > MAX_ANSWER_LEN) {
    throw new Error(`Nudge answer exceeds ${MAX_ANSWER_LEN} chars (${answer.length}): "${answer}"`);
  }
  return answer;
}

function fitTagMajority(product: DenimProduct): "runs_small" | "true_to_size" | "runs_large" | null {
  const counts: Record<string, number> = {};
  for (const r of product.reviews) {
    if (!r.fitTag) continue;
    counts[r.fitTag] = (counts[r.fitTag] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0] as "runs_small" | "true_to_size" | "runs_large";
}

function buildSizeNudge(product: DenimProduct, surface: Surface): Omit<NudgeContent, "id"> {
  const majority = fitTagMajority(product);
  const fitReviewCount = product.reviews.filter((r) => r.fitTag).length;

  let answer: string;
  if (majority === "runs_small") {
    answer = "Runs small in the waist. Most people size up one.";
  } else if (majority === "runs_large") {
    answer = "Runs large. Most people size down one.";
  } else {
    answer = "Fits true to size for most people in this style.";
  }

  return {
    hesitationType: "size",
    productId: product.id,
    answer: assertAnswerLength(answer),
    evidence: {
      label: `from ${fitReviewCount} reviews of this fit`,
      kind: "reviews",
      weight: fitReviewCount,
    },
    action: { label: "Open size chart", kind: "open_measurement_table" },
    anchor: { surface, elementSelector: '[data-byond-anchor="variant-picker"]' },
  };
}

function buildFitNudge(product: DenimProduct, surface: Surface): Omit<NudgeContent, "id"> {
  const answer = product.fitNote.length <= MAX_ANSWER_LEN
    ? product.fitNote
    : product.fitNote.slice(0, MAX_ANSWER_LEN - 1).trimEnd() + "…";

  return {
    hesitationType: "fit",
    productId: product.id,
    answer: assertAnswerLength(answer),
    evidence: {
      label: `worn by a ${product.modelInfo.heightCm}cm model in size ${product.modelInfo.wornSize}`,
      kind: "metafield",
    },
    action: { label: "See measurements", kind: "open_measurement_table" },
    anchor: { surface, elementSelector: '[data-byond-anchor="fit-block"]' },
  };
}

function buildReturnsRiskNudge(_product: DenimProduct, surface: Surface): Omit<NudgeContent, "id"> {
  const answer = RETURNS_POLICY.freeExchanges
    ? `Free exchanges within ${RETURNS_POLICY.windowDays} days if the size is wrong.`
    : `${RETURNS_POLICY.windowDays}-day return window if the size is wrong.`;

  return {
    hesitationType: "returns_risk",
    productId: _product.id,
    answer: assertAnswerLength(answer),
    evidence: { label: "from this store's returns policy", kind: "policy" },
    anchor: { surface, elementSelector: '[data-byond-anchor="price-block"]' },
  };
}

function buildFabricNudge(product: DenimProduct, surface: Surface): Omit<NudgeContent, "id"> {
  const stretchCounts = { stretch: 0, rigid: 0 };
  for (const r of product.reviews) {
    if (r.stretchRigid === "stretch") stretchCounts.stretch++;
    if (r.stretchRigid === "rigid") stretchCounts.rigid++;
  }
  const leaning = stretchCounts.stretch >= stretchCounts.rigid ? "stretch" : "rigid";
  const answer =
    leaning === "stretch"
      ? `${product.composition}. Has stretch and holds its shape through the day.`
      : `${product.composition}. Rigid denim, softens with wear.`;

  return {
    hesitationType: "fabric",
    productId: product.id,
    answer: assertAnswerLength(answer.length <= MAX_ANSWER_LEN ? answer : `${product.composition}.`),
    evidence: { label: "from this product's fabric composition", kind: "metafield" },
    anchor: { surface, elementSelector: '[data-byond-anchor="fabric-block"]' },
  };
}

const BUILDERS: Record<
  Extract<HesitationType, "size" | "fit" | "returns_risk" | "fabric">,
  (product: DenimProduct, surface: Surface) => Omit<NudgeContent, "id">
> = {
  size: buildSizeNudge,
  fit: buildFitNudge,
  returns_risk: buildReturnsRiskNudge,
  fabric: buildFabricNudge,
};

export function assembleNudge(
  type: keyof typeof BUILDERS,
  product: DenimProduct,
  surface: Surface,
): Omit<NudgeContent, "id"> {
  return BUILDERS[type](product, surface);
}
