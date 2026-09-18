/**
 * Which figures on this dashboard are backed by the Cue backend today, and
 * which are still placeholder.
 *
 * Audited field by field against the repo — schema, emit sites, and the
 * insight queries. Every `unwired` entry names the exact reason and the
 * change that would fix it, so the red dots are a work list rather than a
 * disclaimer. Verified against:
 *   packages/backend/src/db/migrations/*.sql
 *   packages/backend/src/insights/*.ts
 *   packages/widget-sdk/src/signals/*  (every emit() call site)
 *
 * Re-audited 2026-09-18 against Cue e1f02b2, which landed order/refund
 * webhooks, product_id on both log tables, a no_content_available
 * suppression reason, add_to_cart emission, and full chat-question capture.
 * Five fields moved from unwired to wired as a result.
 */

export interface Wiring {
  wired: boolean;
  /** Where the number comes from — shown on wired fields for traceability. */
  source?: string;
  /** Why it is not wired yet. */
  reason?: string;
  /** The backend change that would wire it. */
  fix?: string;
}

export const WIRING = {
  /* ---------------------------------------------------------------- wired */
  sessions: {
    wired: true,
    source:
      "nudge_performance_insights.nudged_sessions + holdout_sessions, per card type and content variant.",
  },
  holdoutSplit: {
    wired: true,
    source:
      "suppression_log rows with reason = 'control_holdout'. Assignment is random, per-shop, and never 0%.",
  },
  significance: {
    wired: true,
    source:
      "Two-proportion z-test in insights/statistics.ts. Returns nothing below 30 sessions per group rather than a weak p-value.",
  },
  suppression: {
    wired: true,
    source:
      "suppression_log, one row per suppressed candidate with the rule that fired.",
  },
  consentCoverage: {
    wired: true,
    source:
      "GET /dashboard/consent-summary — distinct sessions grouped by consent status.",
  },
  coverage: {
    wired: true,
    source:
      "card_content joined to products — a product with a card of that type has content for that topic.",
  },
  answerText: {
    wired: true,
    source: "card_content.content_text — the exact line shoppers are served.",
  },
  evidence: {
    wired: true,
    source:
      "card_content.source_chunk_ids, traceable back to the indexed store content it was built from.",
  },
  postNudgeResolution: {
    wired: true,
    source:
      "post_nudge_variant_change, post_nudge_size_guide_reopen, post_nudge_policy_nav, post_nudge_exit.",
  },
  nudgeEngagement: {
    wired: true,
    source:
      "nudge_impression (viewport-confirmed), nudge_dismiss, nudge_ignored, nudge_action_click.",
  },
  questionDemand: {
    wired: true,
    source:
      "GET /dashboard/chat-question-clusters — clustered demand across answered and unanswered questions, with a count and sample phrasings per cluster.",
  },
  productOutcomes: {
    wired: true,
    source:
      "GET /dashboard/product-outcomes — ordered quantity, order value and returned quantity per product, from the order and refund webhooks.",
  },
  frictionUi: {
    wired: true,
    source:
      "friction_insights — dead clicks, rage-click clusters and scroll hunting, by selector, with severity.",
  },

  /* -------------------------------------------------------------- unwired */
  conversion: {
    wired: true,
    source:
      "add_to_cart, emitted from the byond:cart-updated listener in signals/bracketing.ts for genuinely new cart lines (size swaps excluded). Ingestion writes outcome.conversion.addedToCart, and nudge-performance counts it for both lift and the bandit's reward.",
  },
  returnRate: {
    wired: true,
    source:
      "product_returns over product_orders, filled by the REFUNDS_CREATE and ORDERS_CREATE webhooks under the read_orders scope. Per product and aggregate: Shopify's order payloads carry no session_id, so this is the product's return rate over the period, not the return rate of the shoppers who hit this friction point.",
  },
  revenueAtRisk: {
    wired: false,
    reason:
      "Real order value now exists per product in product_orders, but nudge_performance_insights still groups by card type and variant only. Without a product dimension on the insight rows there is nothing to multiply a conversion shortfall against.",
    fix: "Add product_id to the insight group-by, now that nudge_shown_log carries it.",
  },
  trend: {
    wired: false,
    reason:
      "Insight rows are per-period snapshots, but nothing compares consecutive periods. Falling demand is the product's core claim and is currently unmeasurable.",
    fix: "Compare each row against the preceding period window in the digest job.",
  },
  verbatim: {
    wired: true,
    source:
      "chat_questions stores every shopper question with its embedding, answered or not. chat-question-clustering groups phrasings by cosine similarity above 0.85, so four wordings of one question report as one row with a real count.",
  },
  signalSource: {
    wired: false,
    reason:
      "nudge_shown_log.triggering_signals records which signal fired on every row, and the raw feed reads it directly. The insight rollup still aggregates it away, so only the per-intent summary is affected, not the nudge feed.",
    fix: "Carry triggering_signals through the insight aggregation.",
  },
  product: {
    wired: true,
    source:
      "product_id on both nudge_shown_log and suppression_log, written from session.productId at ingestion. Stored as TEXT rather than a foreign key, because the value is client-supplied and a malformed id must not fail an otherwise valid ingestion request.",
  },
  uncovered: {
    wired: true,
    source:
      "The no_content_available suppression reason, logged by the decision engine when a rule matched and restraint approved a card but the content pipeline produced no variant for it. Distinct from no_eligible_rule: this one means the store had nothing to say, which is exactly a content gap.",
  },
  lowConfidence: {
    wired: false,
    reason:
      "Generated content carries no measure of how much source material it was built from, so thin answers look identical to well-evidenced ones.",
    fix: "Store a source-strength score alongside each generated card.",
  },
  resolved: {
    wired: false,
    reason:
      "Nothing records that an answer was promoted onto a product page, so a friction point can never be marked resolved.",
    fix: "Add a promotion record, then retire friction points whose demand falls after it.",
  },
  topicCoverage: {
    wired: false,
    reason:
      "The backend still has five card types while this dashboard shows nine topics. Fabric composition and care text are now loaded into card generation from the custom metafields, but only the size_guide card consumes them — there is still no fabric, colour or care card, and no rule routes zoom or colour_variant_change to one.",
    fix: "Add the missing card types, and route zoom and colour_variant_change to them.",
  },
  checkoutAndOrders: {
    wired: false,
    reason:
      "Orders now arrive through the ORDERS_CREATE webhook, but only as per-product aggregates — Shopify's payload carries no session_id, so an order cannot be tied back to the session that saw the nudge. checkout_started is still emitted by nothing, so the middle of the funnel stays empty.",
    fix: "Inject the session id as a cart attribute at add-to-cart, read it back off the order, and emit checkout_started from the storefront.",
  },
  segments: {
    wired: false,
    reason:
      "Segment keys are built with isReturning and cartValue hardcoded, so device type is the only real dimension.",
    fix: "Feed real returning-visitor and cart-value state into buildSegmentKey.",
  },
} as const satisfies Record<string, Wiring>;

export type WiringKey = keyof typeof WIRING;

export const UNWIRED_KEYS = (
  Object.keys(WIRING) as WiringKey[]
).filter((key) => !WIRING[key].wired);

export const WIRED_COUNT = Object.keys(WIRING).length - UNWIRED_KEYS.length;
