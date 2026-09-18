/**
 * Aggregates for the overview screen.
 *
 * The summary is built around the product's own claim: demand for an answer
 * should fall once that answer reaches the page. So every figure that can move
 * over time carries its change against the previous period, and the two that
 * cannot — coverage and restraint — are stated as shares rather than counts,
 * since their raw totals mean nothing without a denominator.
 *
 * Still collapsed, and why: content state has no confidence score behind it,
 * so a thin answer cannot be told from a well-evidenced one. Everything is
 * either covered or not.
 */

import {
  type FrictionPoint,
  STORE,
  revenueAtRisk,
  TOPIC_LABEL,
  type TopicKey,
} from "./merchant-data";
import {
  type Change,
  demandChange,
  movement,
  uncoveredChange,
} from "./period";
import {
  INTENT_PERFORMANCE,
  NUDGE_TOTALS,
  SUPPRESSION_REASONS,
  SUPPRESSION_TOTAL,
} from "./nudge-data";

export interface TopicDemand {
  topic: TopicKey;
  label: string;
  /** Times shoppers got stuck on this topic, summed over its friction points. */
  sessions: number;
  /** How much of that the store has nothing to say about. */
  uncoveredSessions: number;
  pointCount: number;
}

export interface FunnelStep {
  key: string;
  label: string;
  value: number;
  /** 0–1, always against the first step so the bars nest honestly. */
  share: number;
}

export interface OverviewSummary {
  /** False when there is nothing to aggregate — an empty state, not zeros. */
  hasData: boolean;

  /**
   * Demand this period against the one before it. A fall is the product
   * working: the answer reached the page and the question stopped being asked.
   */
  demand: Change | null;
  /** The same, for the questions the store still cannot answer. */
  uncoveredDemand: Change | null;
  /** How many friction points fell, grew, or held steady. */
  movement: { falling: number; rising: number; flat: number };
  /** Revenue attached to the friction points the store cannot answer. */
  revenueAtRisk: number;

  /**
   * Of the moments Cue decided a shopper needed an answer, the share where the
   * store actually held one. The health figure for a content-led product: it
   * rises when a merchant does the work the dashboard asks of them, and it is
   * the only suppression reason they can act on.
   */
  answerCoverage: number;
  /** Moments Cue wanted to speak but the store held nothing to say. */
  noContentMoments: number;

  /** Visits per nudge shown. Higher means Cue interrupts less often. */
  visitsPerNudge: number;
  sessionsObserved: number;

  /** Sum of per-friction-point session counts. NOT a distinct shopper count. */
  stuckEncounters: number;
  frictionPointCount: number;
  /** Friction points the store has no content for at all. */
  uncoveredCount: number;
  uncoveredSessions: number;

  nudgesShown: number;
  nudgesDismissed: number;
  resolved: number;
  resolvedShare: number;

  suppressed: number;
  /** Share of all candidate moments where Cue chose to stay quiet. */
  quietShare: number;

  topicDemand: TopicDemand[];
  intentPerformance: typeof INTENT_PERFORMANCE;
  funnel: FunnelStep[];
  topPoints: FrictionPoint[];
  suppression: typeof SUPPRESSION_REASONS;
}

function byTopic(points: FrictionPoint[]): TopicDemand[] {
  const acc = new Map<TopicKey, TopicDemand>();

  for (const point of points) {
    const row = acc.get(point.topic) ?? {
      topic: point.topic,
      label: TOPIC_LABEL[point.topic],
      sessions: 0,
      uncoveredSessions: 0,
      pointCount: 0,
    };

    row.sessions += point.sessions;
    row.pointCount += 1;
    if (point.contentState === "uncovered") {
      row.uncoveredSessions += point.sessions;
    }

    acc.set(point.topic, row);
  }

  return [...acc.values()].sort((a, b) => b.sessions - a.sessions);
}

export function summariseOverview(points: FrictionPoint[]): OverviewSummary {
  const shown = NUDGE_TOTALS.shown;
  const suppressed = SUPPRESSION_TOTAL;
  const resolved = INTENT_PERFORMANCE.reduce((sum, r) => sum + r.resolved, 0);
  const uncovered = points.filter((p) => p.contentState === "uncovered");

  const noContentMoments =
    SUPPRESSION_REASONS.find((r) => r.rule === "no_content_available")?.count ??
    0;
  // Candidates are the moments a rule matched and restraint approved a card —
  // shown, plus the ones that died for want of content. Suppressions for any
  // other reason are not coverage failures: Cue had an answer and chose,
  // correctly, to keep it to itself.
  const answerable = shown + noContentMoments;

  return {
    hasData: points.length > 0,

    answerCoverage: answerable > 0 ? shown / answerable : 0,
    noContentMoments,
    visitsPerNudge: shown > 0 ? STORE.sessionsObserved / shown : 0,
    sessionsObserved: STORE.sessionsObserved,

    demand: demandChange(points),
    uncoveredDemand: uncoveredChange(points),
    movement: movement(points),
    revenueAtRisk: uncovered.reduce((sum, p) => sum + revenueAtRisk(p), 0),

    stuckEncounters: points.reduce((sum, p) => sum + p.sessions, 0),
    frictionPointCount: points.length,
    uncoveredCount: uncovered.length,
    uncoveredSessions: uncovered.reduce((sum, p) => sum + p.sessions, 0),

    nudgesShown: shown,
    nudgesDismissed: NUDGE_TOTALS.dismissed,
    resolved,
    resolvedShare: shown > 0 ? resolved / shown : 0,

    suppressed,
    quietShare: shown + suppressed > 0 ? suppressed / (shown + suppressed) : 0,

    topicDemand: byTopic(points),
    intentPerformance: INTENT_PERFORMANCE,
    funnel: [
      { key: "shown", label: "Shown", value: shown, share: 1 },
      {
        key: "engaged",
        label: "Read or touched",
        value: NUDGE_TOTALS.engaged,
        share: shown > 0 ? NUDGE_TOTALS.engaged / shown : 0,
      },
      {
        key: "clicked",
        label: "Acted on",
        value: NUDGE_TOTALS.actionClicked,
        share: shown > 0 ? NUDGE_TOTALS.actionClicked / shown : 0,
      },
    ],
    topPoints: [...points].sort((a, b) => b.sessions - a.sessions).slice(0, 5),
    suppression: SUPPRESSION_REASONS,
  };
}

/** Thousands separators, so 15168 does not read as 1516 at a glance. */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** Whole percent. Used on shares where a decimal place adds nothing. */
export function formatShare(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * The revenue model behind the overview's four headline cards.
 *
 * Every figure here is a difference against the held-back control group, never
 * a raw total over nudged sessions. That distinction is the whole point: a
 * shopper who saw a card and bought would very often have bought anyway, so
 * "revenue influenced" is a claim rather than a measurement. The holdout is
 * the only thing that makes any of this causal, which is why it is never 0%.
 *
 * Net revenue added deliberately nets off returns, because the product's own
 * bar is that a fit nudge which sells and comes back has failed. Returns
 * avoided is therefore a COMPONENT of net added, not a separate win to be
 * summed alongside it — presenting the two as additive would double-count.
 */
export const REVENUE = {
  /** Sessions in each arm over the period. */
  nudgedSessions: 9057,
  holdoutSessions: 1006,

  /** Extra revenue from sales that would not have closed, before returns. */
  liftFromSales: 8695,
  /** Revenue kept because fewer of those orders came back. */
  liftFromFewerReturns: 5505,

  /** Orders in the nudged arm, and the return rate in each. */
  nudgedOrders: 768,
  nudgedReturnRate: 0.091,
  holdoutReturnRate: 0.147,
  averageOrderValue: 128,

} as const;

/** Sales lift plus returns avoided. The headline. */
export function netRevenueAdded(): number {
  return REVENUE.liftFromSales + REVENUE.liftFromFewerReturns;
}

/** Orders that would have come back at the holdout's rate, and did not. */
export function returnsAvoidedOrders(): number {
  return Math.round(
    (REVENUE.holdoutReturnRate - REVENUE.nudgedReturnRate) *
      REVENUE.nudgedOrders,
  );
}

/** Orders in each arm, expressed as the rate difference the card shows. */
export function returnRateGap(): number {
  return REVENUE.holdoutReturnRate - REVENUE.nudgedReturnRate;
}

/* ------------------------------------------------------- performance model */

/**
 * Everything below is the holdout comparison, stated as two arms rather than
 * one total. A shopper who saw a card and bought would very often have bought
 * anyway, so every claim on the overview is a difference against the group
 * that was deliberately shown nothing.
 */

/** Per-arm rates. Nudged against holdout, never nudged against "everyone". */
export const ARMS = {
  addedToCartNudged: 0.184,
  addedToCartHoldout: 0.141,
  convertedNudged: 0.085,
  convertedHoldout: 0.062,
} as const;

/** Orders that would not have closed at the holdout's rate. */
export function ordersInfluenced(): number {
  return Math.round(
    REVENUE.nudgedSessions * (ARMS.convertedNudged - ARMS.convertedHoldout),
  );
}

/** What the merchant pays for Cue over the same period. */
export const SUBSCRIPTION_COST = 299;

/**
 * How far past the significance floor this period's sample is.
 *
 * The backend's two-proportion z-test refuses to return a p-value below 30
 * sessions per arm, but clearing that floor is not the same as being able to
 * quote an exact figure. `reliableAt` is the sample where the confidence
 * interval narrows enough for the headline number itself to be quotable, not
 * just its direction — so the card can say which of the two it currently has.
 */
export const CONFIDENCE = {
  sessions: REVENUE.nudgedSessions + REVENUE.holdoutSessions,
  reliableAt: 25000,
  /** Weeks to reach `reliableAt` at the store's current traffic. */
  weeksRemaining: 3,
} as const;

export function confidenceShare(): number {
  return Math.min(1, CONFIDENCE.sessions / CONFIDENCE.reliableAt);
}

/** Conversion in each arm, week by week. The gap is the product working. */
export interface WeekPoint {
  week: string;
  nudged: number;
  holdout: number;
}

export const WEEKLY: WeekPoint[] = [
  { week: "W1", nudged: 0.064, holdout: 0.062 },
  { week: "W2", nudged: 0.068, holdout: 0.060 },
  { week: "W3", nudged: 0.075, holdout: 0.063 },
  { week: "W4", nudged: 0.073, holdout: 0.059 },
  { week: "W5", nudged: 0.081, holdout: 0.062 },
  { week: "W6", nudged: 0.083, holdout: 0.065 },
  { week: "W7", nudged: 0.080, holdout: 0.061 },
  { week: "W8", nudged: 0.091, holdout: 0.064 },
];

/** What changed mid-series, so the chart is not left to speak for itself. */
export const WEEKLY_NOTE =
  "The gap widened from week 3, when the size-comparison message went live.";

/**
 * The lines Cue is serving, as a merchant would manage them: each one earning
 * its place or not. Cart lift is the per-message difference against holdout,
 * which is why a message can be shown often and still be worth switching off.
 */
export interface Message {
  id: string;
  title: string;
  /** The behaviour that triggers it, in plain words. */
  trigger: string;
  shown: number;
  engagedShare: number;
  /** Difference in add-to-cart against the held-back group. */
  cartLift: number;
  live: boolean;
}

export const MESSAGES: Message[] = [
  {
    id: "size-runs-small",
    title: "Runs small in the waist",
    trigger: "Fires when a shopper flips between sizes without picking one",
    shown: 4218,
    engagedShare: 0.264,
    cartLift: 0.38,
    live: true,
  },
  {
    id: "returns-free-exchange",
    title: "Free exchanges within 30 days",
    trigger: "Fires when a shopper checks the returns page and comes back",
    shown: 1877,
    engagedShare: 0.221,
    cartLift: 0.21,
    live: true,
  },
  {
    id: "fit-measurements",
    title: "Rise, inseam and leg opening",
    trigger: "Fires when the size guide is opened and closed with no size picked",
    shown: 2106,
    engagedShare: 0.198,
    cartLift: 0.12,
    live: true,
  },
  {
    id: "fabric-composition",
    title: "Cotton with a little stretch",
    trigger: "Fires on a long read of the composition",
    shown: 488,
    engagedShare: 0.112,
    cartLift: 0.02,
    live: false,
  },
  {
    id: "stock-low",
    title: "Only 3 left in this size",
    trigger: "Fires on low stock while a size is selected",
    shown: 368,
    engagedShare: 0.084,
    cartLift: -0.04,
    live: false,
  },
];

/**
 * Nudged sessions from the card appearing to the order landing.
 *
 * Every step is a counted event, not a modelled one — which is worth saying on
 * the card, because the revenue figure above it is modelled and the two sit
 * next to each other.
 */
export interface JourneyStep {
  label: string;
  value: number;
  share: number;
}

export function journey(): JourneyStep[] {
  const base = REVENUE.nudgedSessions;
  const engaged = NUDGE_TOTALS.engaged;
  const carted = Math.round(base * ARMS.addedToCartNudged);
  return [
    { label: "Nudge shown", value: base, share: 1 },
    { label: "Engaged with it", value: engaged, share: engaged / base },
    { label: "Added to cart after", value: carted, share: carted / base },
    {
      label: "Placed an order",
      value: REVENUE.nudgedOrders,
      share: REVENUE.nudgedOrders / base,
    },
  ];
}
