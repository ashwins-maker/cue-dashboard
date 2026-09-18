/**
 * Aggregates for the overview screen.
 *
 * Scope rule: a figure appears here only when `WIRING` marks its source wired.
 * Anything the backend cannot answer is left out of the summary entirely
 * rather than computed and then hidden in the UI — an unused field is an
 * invitation to render it later by accident.
 *
 * Deliberately absent, and why:
 *
 *   salesAtRisk   — `revenueAtRisk` is unwired: insight rows still have no
 *                   product dimension to multiply a shortfall against.
 *   trend         — `trend` is unwired: nothing compares consecutive periods.
 *   unmetDemand   — `topicCoverage` is unwired: four of the nine topics have
 *                   no card type behind them, so a catalog coverage figure for
 *                   fabric, colour, care or reviews would be invented.
 *   lowConfidence — unwired, so a thin answer cannot be told from a solid one.
 *                   Content state collapses to covered / not covered.
 */

import {
  type FrictionPoint,
  TOPIC_LABEL,
  type TopicKey,
} from "./merchant-data";
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

  return {
    hasData: points.length > 0,

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
