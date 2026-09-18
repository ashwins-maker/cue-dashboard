// The hesitation taxonomy — this is the spec (PRD §04). Detection, copy templates,
// and the bandit's arms all key off these seven types. v1 ships detection for the
// first four; the rest are logged (scored, never nudged) so the data exists for later.

import type { HesitationSignalEvent, HesitationType } from "./types";

export interface TaxonomyEntry {
  type: HesitationType;
  question: string;
  shipsInV1: boolean;
  // Which signal kinds feed this type's confidence score.
  signalKinds: HesitationSignalEvent["kind"][];
  sources: string[];
}

export const TAXONOMY: Record<HesitationType, TaxonomyEntry> = {
  size: {
    type: "size",
    question: "Which size am I in this brand?",
    shipsInV1: true,
    signalKinds: ["variant_change"],
    sources: ["size_chart", "reviews.fit_notes", "order_history.exchange_reasons"],
  },
  fit: {
    type: "fit",
    question: "Will this shape work on my body?",
    shipsInV1: true,
    signalKinds: ["size_guide_open", "size_guide_close", "dwell"],
    sources: ["metafields.rise_leg_measurements", "metafields.model_height_worn_size", "reviews.fit_tags"],
  },
  returns_risk: {
    type: "returns_risk",
    question: "What happens if I'm wrong?",
    shipsInV1: true,
    signalKinds: ["policy_page_nav"],
    sources: ["policy.returns_exchanges"],
  },
  fabric: {
    type: "fabric",
    question: "Will it stretch, shrink, hold shape?",
    shipsInV1: true,
    signalKinds: ["zoom", "dwell"],
    sources: ["metafields.composition", "metafields.care", "reviews.stretch_rigid"],
  },
  colour_accuracy: {
    type: "colour_accuracy",
    question: "Is the wash really this shade?",
    shipsInV1: false,
    signalKinds: ["colour_variant_change", "zoom"],
    sources: ["reviews.customer_photos", "metafields.wash_description"],
  },
  value: {
    type: "value",
    question: "Is it worth it at this price?",
    shipsInV1: false,
    signalKinds: ["price_dwell", "tab_away_return"],
    sources: ["metafields.construction_details", "reviews.durability"],
  },
  stock: {
    type: "stock",
    question: "Will my size come back?",
    shipsInV1: false,
    signalKinds: ["out_of_stock_select"],
    sources: ["inventory", "restock_signal"],
  },
};

export const V1_TYPES: HesitationType[] = (Object.keys(TAXONOMY) as HesitationType[]).filter(
  (t) => TAXONOMY[t].shipsInV1,
);
