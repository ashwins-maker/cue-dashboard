// Orchestrates one ingest request: score signals, decide, find-or-create the matching
// nudge variant, gate on merchant approval (F-3.1), apply the control holdout (F-4.4),
// and log a structured opportunity record either way (F-4.1) — suppressions included.

import { randomUUID } from "crypto";
import { findProduct } from "./demo-catalog";
import { assembleNudge } from "./nudge-copy";
import { detect } from "./scoring";
import { demoStore } from "./store";
import type { HesitationSignalEvent, HesitationType, NudgeOpportunityRecord, NudgeVariant } from "./types";

const V1_NUDGE_TYPES = ["size", "fit", "returns_risk", "fabric"] as const;
type V1NudgeType = (typeof V1_NUDGE_TYPES)[number];

function isV1NudgeType(t: HesitationType): t is V1NudgeType {
  return (V1_NUDGE_TYPES as readonly string[]).includes(t);
}

const APPROVAL_GATE_DAYS = 30;

function withinApprovalGate(installedAt: string): boolean {
  const installedMs = new Date(installedAt).getTime();
  return Date.now() - installedMs < APPROVAL_GATE_DAYS * 24 * 60 * 60 * 1000;
}

export interface EvaluateResult {
  opportunity: NudgeOpportunityRecord;
  renderNudge: NudgeVariant["content"] | null;
  pendingReview: boolean;
}

export function evaluateSession(
  shopDomain: string,
  sessionId: string,
  surface: HesitationSignalEvent["surface"],
  productId: string,
  recentEvents: HesitationSignalEvent[],
): EvaluateResult {
  const config = demoStore.getConfig(shopDomain);
  const sessionState = demoStore.getSessionState(sessionId);

  const detection = detect(
    recentEvents,
    {
      confidenceFloor: config.confidenceFloor,
      tieMargin: config.tieMargin,
      mutedTypes: config.mutedTypes,
      killSwitch: config.killSwitch,
    },
    sessionState,
  );

  const baseRecord: NudgeOpportunityRecord = {
    id: randomUUID(),
    shopDomain,
    sessionId,
    productId,
    surface,
    timestamp: new Date().toISOString(),
    detection,
    isControlHoldout: false,
  };

  if (detection.decision === "suppressed") {
    demoStore.recordOpportunity(baseRecord);
    return { opportunity: baseRecord, renderNudge: null, pendingReview: false };
  }

  if (
    !isV1NudgeType(detection.type) ||
    config.excludedProductIds.includes(productId)
  ) {
    demoStore.recordOpportunity(baseRecord);
    return { opportunity: baseRecord, renderNudge: null, pendingReview: false };
  }

  // Control holdout — always measurable against a live baseline (F-4.4).
  const isControlHoldout = Math.random() < config.controlHoldoutRate;
  if (isControlHoldout) {
    const record = { ...baseRecord, isControlHoldout: true };
    demoStore.recordOpportunity(record);
    return { opportunity: record, renderNudge: null, pendingReview: false };
  }

  const product = findProduct(productId);
  if (!product) {
    demoStore.recordOpportunity(baseRecord);
    return { opportunity: baseRecord, renderNudge: null, pendingReview: false };
  }

  const variantId = `${shopDomain}:${productId}:${detection.type}`;
  let variant = demoStore.getVariant(variantId);
  if (!variant) {
    const content = assembleNudge(detection.type, product, surface);
    const gated = withinApprovalGate(config.installedAt) && !config.autoPublishTypes.includes(detection.type);
    variant = {
      id: variantId,
      shopDomain,
      hesitationType: detection.type,
      productId,
      content: { ...content, id: variantId },
      status: gated ? "pending_review" : "auto_published",
      createdAt: new Date().toISOString(),
      impressions: 0,
      addToCarts: 0,
      dismissals: 0,
      returns: 0,
    };
    demoStore.upsertVariant(variant);
  }

  const canRender = variant.status === "approved" || variant.status === "auto_published";
  const record = { ...baseRecord, variantId: variant.id };
  demoStore.recordOpportunity(record);

  if (!canRender) {
    return { opportunity: record, renderNudge: null, pendingReview: true };
  }

  demoStore.markNudgeFired(sessionId);
  variant.impressions += 1;
  demoStore.upsertVariant(variant);

  return { opportunity: record, renderNudge: variant.content, pendingReview: false };
}
