/**
 * Server-side data loading for the dashboard.
 *
 * Pulls whatever the Cue backend can actually answer and fills the rest from
 * the placeholder set. The split is not arbitrary — it follows `WIRING` in
 * lib/wiring.ts exactly, so every field the UI marks with a red dot is a
 * field this loader could not source, and vice versa.
 *
 * When no backend is configured the whole page falls back to placeholders and
 * says so once, at the top. The red dots stay visible either way: they mark
 * what today's backend *cannot* supply, not merely what is missing right now.
 */

import {
  fetchCardContent,
  fetchConsentSummary,
  fetchFrictionReport,
  fetchNudgePerformance,
  fetchChatEscalations,
  isBackendConfigured,
  num,
  type FrictionInsightRow,
} from "./cue-api";
import { CARD_TYPE_SUMMARY, CARD_TYPE_TO_TOPIC } from "./adapters";
import {
  COVERAGE,
  FRICTION_POINTS,
  SUPPRESSION,
  type CoverageRow,
  type FrictionPoint,
  type TopicKey,
} from "./merchant-data";

export interface DashboardData {
  /** True when live rows came back from the backend for this section. */
  live: boolean;
  frictionPoints: FrictionPoint[];
  coverage: CoverageRow[];
  uiFriction: FrictionInsightRow[];
  shopperQuestions: { question: string; reply: string; at: string }[];
  consent: {
    grantedSessions: number;
    deniedSessions: number;
    coveragePercent: number | null;
  } | null;
  suppression: typeof SUPPRESSION;
}

/**
 * A live friction point. Fields the backend has no source for are left at
 * their empty value rather than filled with something plausible — the UI
 * renders an em dash and a red dot for each, which is the honest outcome.
 */
function liveFrictionPoints(
  rows: Awaited<ReturnType<typeof fetchNudgePerformance>>,
): FrictionPoint[] {
  if (!rows) return [];

  return rows.map((row) => ({
    id: `${row.card_type}:${row.variant_label}`,
    summary: CARD_TYPE_SUMMARY[row.card_type] ?? row.card_type,
    topic: CARD_TYPE_TO_TOPIC[row.card_type] ?? "fit",

    // Not wired: insight rows carry no product dimension.
    productId: "",
    productTitle: "",
    productPrice: 0,

    // Not wired: triggering signals are aggregated away by the rollup.
    source: "behavioural",

    sessions: row.nudged_sessions + row.holdout_sessions,

    // Not wired: nothing compares consecutive periods.
    trend: { direction: "down", value: "—" },

    // Every live row exists because a card was shown, so content existed.
    // "uncovered" cannot appear here at all until the backend can log it.
    contentState: "covered",

    conversion: num(row.nudged_conversion_rate),
    baseline: num(row.holdout_conversion_rate),

    // Not wired: no returns pipeline exists.
    returnRate: null,

    recommendation: row.is_statistically_significant
      ? "Significant against the holdout. Consider promoting this answer onto the product page."
      : "Not enough evidence yet. Keep serving and check again once the sample grows.",
  }));
}

function liveCoverage(
  cards: Awaited<ReturnType<typeof fetchCardContent>>,
): CoverageRow[] {
  if (!cards || cards.length === 0) return [];

  const productsByTopic = new Map<TopicKey, Set<string>>();
  const allProducts = new Set<string>();

  for (const card of cards) {
    allProducts.add(card.productId);
    const topic = CARD_TYPE_TO_TOPIC[card.cardType];
    if (!topic) continue;
    const set = productsByTopic.get(topic) ?? new Set<string>();
    set.add(card.productId);
    productsByTopic.set(topic, set);
  }

  return [...productsByTopic.entries()]
    .map(([topic, products]) => ({
      topic,
      productsCovered: products.size,
      productsTotal: allProducts.size,
      // Not wired: demand per topic needs the product dimension on insights.
      sessionsSeeking: 0,
    }))
    .sort((a, b) => b.productsCovered - a.productsCovered);
}

export async function loadDashboardData(): Promise<DashboardData> {
  if (!isBackendConfigured()) {
    return {
      live: false,
      frictionPoints: FRICTION_POINTS,
      coverage: COVERAGE,
      uiFriction: [],
      shopperQuestions: [],
      consent: null,
      suppression: SUPPRESSION,
    };
  }

  const [performance, cards, friction, consent, escalations] =
    await Promise.all([
      fetchNudgePerformance(4),
      fetchCardContent(),
      fetchFrictionReport(4),
      fetchConsentSummary(30),
      fetchChatEscalations("open"),
    ]);

  const frictionPoints = liveFrictionPoints(performance);
  const coverage = liveCoverage(cards);

  return {
    // A configured backend with no insight rows yet is still "live" — the
    // empty state is the truth, and filling it with placeholders would hide
    // that the digest job has not run.
    live: performance !== null,
    frictionPoints: frictionPoints.length > 0 ? frictionPoints : [],
    coverage: coverage.length > 0 ? coverage : [],
    uiFriction: friction ?? [],
    shopperQuestions: (escalations ?? []).map((row) => ({
      question: row.question,
      reply: row.assistantReply,
      at: row.createdAt,
    })),
    consent: consent
      ? {
          grantedSessions: consent.grantedSessions,
          deniedSessions: consent.deniedSessions,
          coveragePercent: consent.measurementCoveragePercent,
        }
      : null,
    suppression: SUPPRESSION,
  };
}
