/**
 * Maps the Cue backend's row shapes onto the dashboard's UI types.
 *
 * This file is also the honest record of where the two models do not meet.
 * Anything the backend cannot supply today is listed in `UNAVAILABLE_FIELDS`
 * with the reason, and the adapter leaves the field null rather than
 * inventing a plausible number. A dashboard that quietly fabricates a
 * return rate is worse than one that admits it does not have one yet.
 */

import type {
  ContentState,
  FrictionPoint,
  SignalSource,
  TopicKey,
} from "./merchant-data";
import {
  num,
  type CardContentRow,
  type ChatEscalationRow,
  type NudgePerformanceRow,
} from "./cue-api";

/** The backend's `card_type` is the closest thing it has to our `topic`. */
export const CARD_TYPE_TO_TOPIC: Record<string, TopicKey> = {
  size_guide: "size",
  shipping_info: "delivery",
  stock_urgency: "stock",
  reassurance: "returns",
  back_in_stock_prompt: "stock",
};

export const CARD_TYPE_SUMMARY: Record<string, string> = {
  size_guide: "Which size to take in this fit",
  shipping_info: "When the order will arrive",
  stock_urgency: "Whether the chosen size is still available",
  reassurance: "What happens if the item is wrong",
  back_in_stock_prompt: "Whether a sold-out size will return",
};

/**
 * Fields the UI renders that the backend has no source for today. Each entry
 * is a concrete backend change, not a UI compromise — see the integration
 * notes in the repo root for what each one requires.
 */
export const UNAVAILABLE_FIELDS = {
  returnRate:
    "No return/exchange outcome exists. `return_or_exchange` is in the event catalog as nightly_batch, but NudgeOutcome.conversion has no `returned` field and the nightly join is unbuilt.",
  revenueAtRisk:
    "NudgeOutcome.conversion.orderValue exists but is not aggregated anywhere, and there is no per-product price on the insight rows to model a shortfall against.",
  uncoveredContent:
    "SuppressionReason has no `no_content_available` member. A friction point the store cannot answer is indistinguishable from `no_eligible_rule` today.",
  signalSource:
    "nudge_shown_log.triggering_signals records which signal fired, but nudge_performance_insights aggregates it away. Direct/topic/behavioural cannot be split per friction point.",
  verbatim:
    "chat_escalations stores question text only for questions the assistant FAILED to answer. Successfully answered questions are never persisted.",
  productTitle:
    "nudge_performance_insights aggregates by card_type across all products — there is no product dimension on the row.",
} as const;

export interface AdaptedFrictionPoint
  extends Omit<
    FrictionPoint,
    "returnRate" | "productTitle" | "productPrice" | "verbatim" | "trend"
  > {
  returnRate: null;
  productTitle: string | null;
  productPrice: number | null;
  verbatim?: string[];
  trend: { direction: "up" | "down"; value: string } | null;
  /** Straight from the backend's z-test — the UI must not claim lift without it. */
  isSignificant: boolean;
  pValue: number | null;
  nudgedSessions: number;
  holdoutSessions: number;
}

/**
 * One friction point per (card_type, variant_label) the backend reported on.
 *
 * `contentState` is always 'covered' here by construction: a
 * nudge_performance_insights row only exists because a card was actually
 * shown, which means the store had content for it. Uncovered friction points
 * — the ones our Content gaps view is built around — cannot come from this
 * endpoint at all (see UNAVAILABLE_FIELDS.uncoveredContent).
 */
export function adaptNudgePerformance(
  rows: NudgePerformanceRow[],
): AdaptedFrictionPoint[] {
  return rows.map((row) => {
    const conversion = num(row.nudged_conversion_rate);
    const baseline = num(row.holdout_conversion_rate);
    const contentState: ContentState = "covered";
    const source: SignalSource = "behavioural";

    return {
      id: `${row.card_type}:${row.variant_label}`,
      summary:
        CARD_TYPE_SUMMARY[row.card_type] ?? `Card type: ${row.card_type}`,
      topic: CARD_TYPE_TO_TOPIC[row.card_type] ?? "fit",
      productId: "",
      productTitle: null,
      productPrice: null,
      source,
      sessions: row.nudged_sessions + row.holdout_sessions,
      nudgedSessions: row.nudged_sessions,
      holdoutSessions: row.holdout_sessions,
      trend: null,
      contentState,
      conversion,
      baseline,
      returnRate: null,
      isSignificant: row.is_statistically_significant,
      pValue: row.p_value === null ? null : num(row.p_value),
      recommendation: row.is_statistically_significant
        ? "Significant against the holdout — consider promoting this answer onto the product page."
        : "Not enough evidence yet. Keep serving and re-check once the sample grows.",
    };
  });
}

/**
 * Escalations are the only verbatim shopper questions the backend keeps, and
 * they are by definition the ones the assistant could not answer — which
 * makes every one of them a content gap with the shopper's own wording
 * attached. The single richest input the UI has, and the narrowest.
 */
export interface AdaptedContentGap {
  id: string;
  question: string;
  assistantReply: string;
  productId: string | null;
  createdAt: string;
  status: "open" | "resolved";
}

export function adaptEscalations(
  rows: ChatEscalationRow[],
): AdaptedContentGap[] {
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    assistantReply: row.assistantReply,
    productId: row.productId,
    createdAt: row.createdAt,
    status: row.status,
  }));
}

/**
 * Catalog coverage, derived from generated card content rather than from any
 * dedicated endpoint: a product with a card of a given type has content for
 * that topic; one without does not. This is the one place the UI's coverage
 * view maps cleanly onto data the backend already holds.
 */
export interface AdaptedCoverage {
  topic: TopicKey;
  productsCovered: number;
  cardCount: number;
}

export function adaptCoverage(rows: CardContentRow[]): AdaptedCoverage[] {
  const byTopic = new Map<TopicKey, Set<string>>();
  const cardCounts = new Map<TopicKey, number>();

  for (const row of rows) {
    const topic = CARD_TYPE_TO_TOPIC[row.cardType];
    if (!topic) continue;
    const products = byTopic.get(topic) ?? new Set<string>();
    products.add(row.productId);
    byTopic.set(topic, products);
    cardCounts.set(topic, (cardCounts.get(topic) ?? 0) + 1);
  }

  return [...byTopic.entries()].map(([topic, products]) => ({
    topic,
    productsCovered: products.size,
    cardCount: cardCounts.get(topic) ?? 0,
  }));
}
