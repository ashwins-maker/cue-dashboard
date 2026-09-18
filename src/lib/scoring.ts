// Signal -> confidence scoring and suppression (F-1.2, F-1.3).
// In production this runs client-side against a rules bundle for latency, with weights
// served/refreshed from the backend (PRD §05). For the demo, the same pure function runs
// both in the theme extension bundle and here in the ingest route, so behaviour is identical.

import { TAXONOMY, V1_TYPES } from "./taxonomy";
import type { DetectionResult, HesitationScore, HesitationSignalEvent, HesitationType, StoreConfig } from "./types";

export const DEFAULT_STORE_CONFIG: Omit<StoreConfig, "shopDomain" | "installedAt"> = {
  confidenceFloor: 0.55,
  tieMargin: 0.08,
  sessionNudgeCap: 1,
  cooldownSeconds: 45,
  mutedTypes: [],
  excludedProductIds: [],
  excludedCollectionIds: [],
  killSwitch: false,
  autoPublishTypes: [],
  controlHoldoutRate: 0.2,
};

interface RuleWeights {
  variantFlipThreshold: number; // count of distinct variant_change within window
  variantFlipWindowMs: number;
  sizeGuideDwellMs: number;
  fabricZoomThreshold: number;
  fabricDwellMs: number;
}

const WEIGHTS: RuleWeights = {
  variantFlipThreshold: 3,
  variantFlipWindowMs: 20_000,
  sizeGuideDwellMs: 4_000,
  fabricZoomThreshold: 2,
  fabricDwellMs: 5_000,
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function scoreSize(events: HesitationSignalEvent[]): number {
  const changes = events.filter((e) => e.kind === "variant_change");
  if (changes.length < 2) return 0;
  const windowStart = Date.now() - WEIGHTS.variantFlipWindowMs;
  const recent = changes.filter((e) => new Date(e.timestamp).getTime() >= windowStart);
  const distinctFlips = recent.length;
  if (distinctFlips === 0) return 0;
  return clamp01(distinctFlips / WEIGHTS.variantFlipThreshold);
}

function scoreFit(events: HesitationSignalEvent[]): number {
  const opened = events.some((e) => e.kind === "size_guide_open");
  const closed = events.some((e) => e.kind === "size_guide_close");
  const noSelectionAfter = !events.some(
    (e) => e.kind === "variant_change" && opened && new Date(e.timestamp) > new Date(events.find((x) => x.kind === "size_guide_open")!.timestamp),
  );
  let score = 0;
  if (opened && closed && noSelectionAfter) score += 0.7;
  const fitDwell = events.find((e) => e.kind === "dwell" && e.payload.block === "fit");
  if (fitDwell && typeof fitDwell.payload.ms === "number" && fitDwell.payload.ms >= WEIGHTS.sizeGuideDwellMs) {
    score += 0.4;
  }
  return clamp01(score);
}

function scoreReturnsRisk(events: HesitationSignalEvent[]): number {
  const detour = events.filter((e) => e.kind === "policy_page_nav" && e.payload.policy === "returns");
  return detour.length > 0 ? clamp01(0.6 + 0.2 * (detour.length - 1)) : 0;
}

function scoreFabric(events: HesitationSignalEvent[]): number {
  const zooms = events.filter((e) => e.kind === "zoom" && e.payload.target === "fabric_texture");
  const dwell = events.find((e) => e.kind === "dwell" && e.payload.block === "composition");
  let score = 0;
  if (zooms.length >= WEIGHTS.fabricZoomThreshold) score += 0.5;
  if (dwell && typeof dwell.payload.ms === "number" && dwell.payload.ms >= WEIGHTS.fabricDwellMs) score += 0.4;
  return clamp01(score);
}

const SCORERS: Partial<Record<HesitationType, (events: HesitationSignalEvent[]) => number>> = {
  size: scoreSize,
  fit: scoreFit,
  returns_risk: scoreReturnsRisk,
  fabric: scoreFabric,
};

export function scoreSession(events: HesitationSignalEvent[]): HesitationScore[] {
  return V1_TYPES.map((type) => ({
    type,
    confidence: SCORERS[type]?.(events) ?? 0,
  })).filter((s) => s.confidence > 0);
}

export interface SessionNudgeState {
  nudgeFiredThisSession: boolean;
  lastDismissedTypes: HesitationType[];
}

export function detect(
  events: HesitationSignalEvent[],
  config: Pick<StoreConfig, "confidenceFloor" | "tieMargin" | "mutedTypes" | "killSwitch">,
  sessionState: SessionNudgeState,
): DetectionResult {
  const consent = events[events.length - 1]?.consent;
  if (config.killSwitch || (consent && consent.analytics === false)) {
    return { decision: "suppressed", reason: "consent_denied", scores: [] };
  }

  const scores = scoreSession(events).filter((s) => !config.mutedTypes.includes(s.type));

  if (sessionState.nudgeFiredThisSession) {
    return { decision: "suppressed", reason: "already_fired", scores };
  }

  const eligible = scores.filter((s) => !sessionState.lastDismissedTypes.includes(s.type));
  const sorted = [...eligible].sort((a, b) => b.confidence - a.confidence);
  const top = sorted[0];
  const runnerUp = sorted[1];

  if (!top || top.confidence < config.confidenceFloor) {
    return { decision: "suppressed", reason: "below_floor", scores };
  }
  if (runnerUp && top.confidence - runnerUp.confidence < config.tieMargin) {
    return { decision: "suppressed", reason: "tie", scores };
  }

  return { decision: "nudge", type: top.type, confidence: top.confidence, scores };
}
