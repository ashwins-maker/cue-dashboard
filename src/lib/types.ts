// Core domain types for Cue (PRD v1, denim pilot).
// See src/lib/taxonomy.ts for the hesitation taxonomy these types key off.

export type HesitationType =
  | "size"
  | "fit"
  | "returns_risk"
  | "fabric"
  | "colour_accuracy"
  | "value"
  | "stock";

export type Surface = "pdp" | "collection" | "cart" | "checkout";

// Raw signals captured by the theme extension / web pixel.
// One event per discrete browser-observable action — never behaviour narrated back to the shopper.
export interface HesitationSignalEvent {
  sessionId: string;
  shopDomain: string;
  surface: Surface;
  productId: string;
  variantId?: string;
  timestamp: string; // ISO 8601
  kind:
    | "variant_change"
    | "size_guide_open"
    | "size_guide_close"
    | "scroll_depth"
    | "dwell"
    | "zoom"
    | "policy_page_nav"
    | "cart_interaction"
    | "colour_variant_change"
    | "price_dwell"
    | "tab_away_return"
    | "out_of_stock_select";
  // Free-form payload specific to `kind`, e.g. { fromVariant, toVariant } for variant_change,
  // { blockId, ms } for dwell. Validated by the ingest route, not trusted blindly.
  payload: Record<string, unknown>;
  consent: {
    analytics: boolean;
    marketing: boolean;
  };
}

export interface HesitationScore {
  type: HesitationType;
  confidence: number; // 0..1
}

// Outcome of running the rules bundle against a session's recent signal window.
export type DetectionResult =
  | { decision: "suppressed"; reason: "below_floor" | "tie" | "already_fired" | "consent_denied"; scores: HesitationScore[] }
  | { decision: "nudge"; type: HesitationType; confidence: number; scores: HesitationScore[] };

export interface NudgeSource {
  label: string; // e.g. "214 reviews of this fit"
  kind: "reviews" | "size_chart" | "policy" | "metafield" | "order_history";
  weight?: number;
}

export interface NudgeContent {
  id: string;
  hesitationType: HesitationType;
  productId: string;
  variantId?: string;
  answer: string; // <140 chars, resolution first
  evidence: NudgeSource;
  action?: {
    label: string;
    kind: "select_variant" | "open_measurement_table";
    value?: string;
  };
  anchor: {
    surface: Surface;
    elementSelector: string;
  };
}

export type VariantStatus = "pending_review" | "approved" | "rejected" | "auto_published" | "retired";

export interface NudgeVariant {
  id: string;
  shopDomain: string;
  hesitationType: HesitationType;
  productId: string;
  content: NudgeContent;
  status: VariantStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // Bandit bookkeeping (F-4.2 / F-4.3) — impressions/conversions accrue via outcome records,
  // these are denormalized counters for fast arm selection.
  impressions: number;
  addToCarts: number;
  dismissals: number;
  returns: number;
}

export type NudgeOutcome = "add_to_cart" | "dismiss" | "browse_away" | "exit" | "no_action";

// One structured record per nudge opportunity, including suppressions (F-4.1).
export interface NudgeOpportunityRecord {
  id: string;
  shopDomain: string;
  sessionId: string;
  productId: string;
  surface: Surface;
  timestamp: string;
  detection: DetectionResult;
  variantId?: string; // which NudgeVariant was shown, if any
  isControlHoldout: boolean; // F-4.4
  outcome?: NudgeOutcome;
  outcomeAt?: string;
  returnedLater?: boolean; // filled in nightly from exchange/return sync
}

export interface StoreConfig {
  shopDomain: string;
  installedAt: string;
  confidenceFloor: number; // default per taxonomy, merchant-tunable within bounds
  tieMargin: number;
  sessionNudgeCap: number;
  cooldownSeconds: number;
  mutedTypes: HesitationType[];
  excludedProductIds: string[];
  excludedCollectionIds: string[];
  killSwitch: boolean;
  autoPublishTypes: HesitationType[]; // only allowed after first 30 days (F-3.1)
  controlHoldoutRate: number; // 0..1, F-4.4
}
