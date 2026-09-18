/**
 * Period-over-period change.
 *
 * The product's claim is that demand for an answer falls once that answer is
 * on the page — a friction point that disappears has been resolved. That claim
 * is only legible against a previous period, so every headline figure that can
 * move over time carries one.
 *
 * `FrictionPoint.trend` already states each point's change as a signed
 * percentage. Rather than store a second, separately-maintained number that
 * could drift out of step with it, the previous-period session count is
 * derived from that percentage. One source, no contradiction.
 */

import type { FrictionPoint } from "./merchant-data";

export interface Change {
  /** Signed fraction, e.g. -0.12 for a 12% fall. */
  ratio: number;
  /** Rendered as the MetricCard expects it. */
  direction: "up" | "down";
  value: string;
  /** Absolute difference, for cases where the count reads better than the share. */
  absolute: number;
}

/** Parses "+34%" / "−12%" against a direction into a signed fraction. */
function signedRatio(trend: FrictionPoint["trend"]): number {
  const magnitude = Number.parseFloat(trend.value.replace(/[^\d.]/g, "")) / 100;
  if (!Number.isFinite(magnitude)) return 0;
  return trend.direction === "down" ? -magnitude : magnitude;
}

/** What this friction point was worth in the period before this one. */
export function previousSessions(point: FrictionPoint): number {
  const ratio = signedRatio(point.trend);
  // A point that doubled cannot have had a negative past; guard the divisor.
  if (ratio <= -1) return point.sessions;
  return Math.round(point.sessions / (1 + ratio));
}

export function change(current: number, previous: number): Change | null {
  if (previous <= 0) return null;
  const ratio = (current - previous) / previous;
  return {
    ratio,
    direction: ratio >= 0 ? "up" : "down",
    value: `${Math.abs(Math.round(ratio * 100))}%`,
    absolute: current - previous,
  };
}

/** Total demand this period against the one before it. */
export function demandChange(points: FrictionPoint[]): Change | null {
  const current = points.reduce((sum, p) => sum + p.sessions, 0);
  const previous = points.reduce((sum, p) => sum + previousSessions(p), 0);
  return change(current, previous);
}

/** The same, restricted to points the store cannot answer. */
export function uncoveredChange(points: FrictionPoint[]): Change | null {
  const uncovered = points.filter((p) => p.contentState === "uncovered");
  return demandChange(uncovered);
}

/**
 * How many friction points fell and how many grew. A count reads better than
 * a net percentage here: eight falling and two spiking is a different store
 * from ten drifting sideways, and the average hides that.
 */
export function movement(points: FrictionPoint[]): {
  falling: number;
  rising: number;
  flat: number;
} {
  let falling = 0;
  let rising = 0;
  let flat = 0;
  for (const point of points) {
    const ratio = signedRatio(point.trend);
    if (ratio <= -0.05) falling += 1;
    else if (ratio >= 0.05) rising += 1;
    else flat += 1;
  }
  return { falling, rising, flat };
}
