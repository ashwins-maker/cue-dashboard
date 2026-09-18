// Storage interface + in-memory demo implementation. Swap `demoStore` for a Neon-backed
// implementation of the same `Store` interface when the DB decision is made — nothing
// above this layer (API routes, extensions) should need to change.
//
// In-memory only: fine for a single long-lived `next dev` process demoing the flow, not
// for a real multi-instance deployment. That tradeoff was explicit (DB held off for now).

import type { HesitationSignalEvent, HesitationType, NudgeOpportunityRecord, NudgeVariant, StoreConfig } from "./types";
import { DEFAULT_STORE_CONFIG } from "./scoring";

export interface Store {
  getConfig(shopDomain: string): StoreConfig;
  updateConfig(shopDomain: string, patch: Partial<StoreConfig>): StoreConfig;

  recordOpportunity(record: NudgeOpportunityRecord): void;
  listOpportunities(shopDomain: string): NudgeOpportunityRecord[];
  getOpportunity(id: string): NudgeOpportunityRecord | undefined;
  updateOpportunityOutcome(id: string, outcome: NudgeOpportunityRecord["outcome"]): NudgeOpportunityRecord | undefined;

  upsertVariant(variant: NudgeVariant): void;
  getVariant(id: string): NudgeVariant | undefined;
  listVariants(shopDomain: string, filter?: { status?: NudgeVariant["status"] }): NudgeVariant[];

  getSessionState(sessionId: string): { nudgeFiredThisSession: boolean; lastDismissedTypes: HesitationType[] };
  markNudgeFired(sessionId: string): void;
  markDismissed(sessionId: string, type: HesitationType): void;

  appendEvent(sessionId: string, productId: string, event: HesitationSignalEvent): void;
  getRecentEvents(sessionId: string, productId: string, windowMs?: number): HesitationSignalEvent[];
}

class InMemoryStore implements Store {
  private configs = new Map<string, StoreConfig>();
  private opportunities: NudgeOpportunityRecord[] = [];
  private variants = new Map<string, NudgeVariant>();
  private sessions = new Map<string, { nudgeFiredThisSession: boolean; lastDismissedTypes: HesitationType[] }>();
  private eventBuffers = new Map<string, HesitationSignalEvent[]>();

  private static readonly EVENT_BUFFER_WINDOW_MS = 5 * 60 * 1000;
  private static readonly EVENT_BUFFER_MAX = 200;

  getConfig(shopDomain: string): StoreConfig {
    let cfg = this.configs.get(shopDomain);
    if (!cfg) {
      cfg = { shopDomain, installedAt: new Date().toISOString(), ...DEFAULT_STORE_CONFIG };
      this.configs.set(shopDomain, cfg);
    }
    return cfg;
  }

  updateConfig(shopDomain: string, patch: Partial<StoreConfig>): StoreConfig {
    const current = this.getConfig(shopDomain);
    const updated = { ...current, ...patch };
    this.configs.set(shopDomain, updated);
    return updated;
  }

  recordOpportunity(record: NudgeOpportunityRecord): void {
    this.opportunities.push(record);
  }

  listOpportunities(shopDomain: string): NudgeOpportunityRecord[] {
    return this.opportunities.filter((o) => o.shopDomain === shopDomain);
  }

  getOpportunity(id: string): NudgeOpportunityRecord | undefined {
    return this.opportunities.find((o) => o.id === id);
  }

  updateOpportunityOutcome(id: string, outcome: NudgeOpportunityRecord["outcome"]): NudgeOpportunityRecord | undefined {
    const record = this.opportunities.find((o) => o.id === id);
    if (!record) return undefined;
    record.outcome = outcome;
    record.outcomeAt = new Date().toISOString();
    return record;
  }

  upsertVariant(variant: NudgeVariant): void {
    this.variants.set(variant.id, variant);
  }

  getVariant(id: string): NudgeVariant | undefined {
    return this.variants.get(id);
  }

  listVariants(shopDomain: string, filter?: { status?: NudgeVariant["status"] }): NudgeVariant[] {
    return [...this.variants.values()].filter(
      (v) => v.shopDomain === shopDomain && (!filter?.status || v.status === filter.status),
    );
  }

  getSessionState(sessionId: string) {
    let s = this.sessions.get(sessionId);
    if (!s) {
      s = { nudgeFiredThisSession: false, lastDismissedTypes: [] };
      this.sessions.set(sessionId, s);
    }
    return s;
  }

  markNudgeFired(sessionId: string): void {
    this.getSessionState(sessionId).nudgeFiredThisSession = true;
  }

  markDismissed(sessionId: string, type: HesitationType): void {
    this.getSessionState(sessionId).lastDismissedTypes.push(type);
  }

  appendEvent(sessionId: string, productId: string, event: HesitationSignalEvent): void {
    const key = `${sessionId}:${productId}`;
    const windowStart = Date.now() - InMemoryStore.EVENT_BUFFER_WINDOW_MS;
    const existing = (this.eventBuffers.get(key) ?? []).filter(
      (e) => new Date(e.timestamp).getTime() >= windowStart,
    );
    existing.push(event);
    this.eventBuffers.set(key, existing.slice(-InMemoryStore.EVENT_BUFFER_MAX));
  }

  getRecentEvents(sessionId: string, productId: string, windowMs = InMemoryStore.EVENT_BUFFER_WINDOW_MS): HesitationSignalEvent[] {
    const key = `${sessionId}:${productId}`;
    const windowStart = Date.now() - windowMs;
    return (this.eventBuffers.get(key) ?? []).filter((e) => new Date(e.timestamp).getTime() >= windowStart);
  }
}

// Module-level singleton so it survives across API route invocations within one dev process.
declare global {
  // eslint-disable-next-line no-var
  var __byondDemoStore: Store | undefined;
}

export const demoStore: Store = globalThis.__byondDemoStore ?? new InMemoryStore();
globalThis.__byondDemoStore = demoStore;
