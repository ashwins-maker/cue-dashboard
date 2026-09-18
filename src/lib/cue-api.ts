/**
 * Typed client for the Cue backend's `/dashboard/*` routes
 * (packages/backend/src/api/dashboard-routes.ts).
 *
 * Every function returns `null` rather than throwing when the backend is not
 * configured or is unreachable — the dashboard is expected to run standalone
 * against placeholder data during design work, and a missing backend is a
 * normal state to render, not an error to crash on.
 */

const BASE_URL = process.env.CUE_BACKEND_URL;
const SHOP_DOMAIN = process.env.CUE_SHOP_DOMAIN;

export function isBackendConfigured(): boolean {
  return Boolean(BASE_URL && SHOP_DOMAIN);
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!BASE_URL) return null;

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      // Dashboard figures are recomputed by scheduled jobs, not per request —
      // a short revalidate keeps the page fast without serving stale weeks.
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------------
   Response shapes — mirrored from the backend's actual row shapes. Postgres
   returns snake_case and numerics as strings over JSON; both are preserved
   here rather than pretended away, and normalised in the adapters.
   --------------------------------------------------------------------------- */

export interface NudgePerformanceRow {
  shop_id: string;
  card_type: string;
  variant_label: string;
  period_start: string;
  period_end: string;
  nudged_sessions: number;
  nudged_conversions: number;
  holdout_sessions: number;
  holdout_conversions: number;
  nudged_conversion_rate: string | number;
  holdout_conversion_rate: string | number;
  lift_percent: string | number;
  p_value: string | number | null;
  is_statistically_significant: boolean;
}

export interface FrictionInsightRow {
  shop_id: string;
  friction_type: "dead_click" | "rage_click" | "scroll_hunting";
  target_selector: string;
  page_type: string | null;
  session_count: number;
  occurrence_count: number;
  baseline_rate: string | number;
  non_conversion_rate: string | number | null;
  severity: "low" | "medium" | "high";
  sample_session_ids: string[];
  period_start: string;
  period_end: string;
}

export interface ConsentSummary {
  grantedSessions: number;
  deniedSessions: number;
  totalSessions: number;
  measurementCoveragePercent: number | null;
}

export interface ChatEscalationRow {
  id: string;
  productId: string | null;
  sessionId: string;
  question: string;
  assistantReply: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface CardContentRow {
  id: string;
  productId: string;
  cardType: string;
  variantLabel: string;
  contentText: string;
  generatedAt: string;
}

export interface BanditArm {
  segmentKey: string;
  cardType: string;
  variantLabel: string;
  alpha: number;
  beta: number;
  estimatedWinRate: number;
}

export interface SegmentPerformanceRow {
  segmentKey: string;
  cardType: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
}

export interface OptimizationSuggestion {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  relatedTab: "performance" | "friction" | "rules";
}

export interface NudgeRuleRow {
  id: string;
  shopId: string | null;
  signalType: string;
  cardType: string;
  conditions: Record<string, unknown>;
  priority: number;
  enabled: boolean;
}

export interface SuppressionRuleRow {
  id: string;
  shopId: string | null;
  ruleName: string;
  conditions: Record<string, unknown>;
  enabled: boolean;
}

/* --------------------------------------------------------------------------- */

/**
 * Resolves the Shopify domain to the internal shop UUID every other route is
 * keyed by. Cached for the process — the mapping never changes for a shop.
 */
let cachedShopId: string | null | undefined;

export async function getShopId(): Promise<string | null> {
  if (cachedShopId !== undefined) return cachedShopId;
  if (!SHOP_DOMAIN) {
    cachedShopId = null;
    return null;
  }

  const result = await get<{ shopId: string }>("/dashboard/shop-lookup", {
    shopDomain: SHOP_DOMAIN,
  });
  cachedShopId = result?.shopId ?? null;
  return cachedShopId;
}

async function forShop<T>(
  path: string,
  extra: Record<string, string> = {},
): Promise<T | null> {
  const shopId = await getShopId();
  if (!shopId) return null;
  return get<T>(path, { shopId, ...extra });
}

export async function fetchNudgePerformance(weeks = 4) {
  const result = await forShop<{ insights: NudgePerformanceRow[] }>(
    "/dashboard/nudge-performance",
    { weeks: String(weeks) },
  );
  return result?.insights ?? null;
}

export async function fetchFrictionReport(weeks = 4) {
  const result = await forShop<{ insights: FrictionInsightRow[] }>(
    "/dashboard/friction-report",
    { weeks: String(weeks) },
  );
  return result?.insights ?? null;
}

export async function fetchConsentSummary(days = 30) {
  return forShop<ConsentSummary>("/dashboard/consent-summary", {
    days: String(days),
  });
}

export async function fetchChatEscalations(status?: "open" | "resolved") {
  const result = await forShop<{ escalations: ChatEscalationRow[] }>(
    "/dashboard/chat-escalations",
    status ? { status } : {},
  );
  return result?.escalations ?? null;
}

export async function fetchCardContent(cardType?: string) {
  const result = await forShop<{ cards: CardContentRow[] }>(
    "/dashboard/card-content",
    cardType ? { cardType } : {},
  );
  return result?.cards ?? null;
}

export async function fetchBanditPerformance() {
  const result = await forShop<{ arms: BanditArm[] }>(
    "/dashboard/bandit-performance",
  );
  return result?.arms ?? null;
}

export async function fetchSegmentPerformance(weeks = 4) {
  const result = await forShop<{ segments: SegmentPerformanceRow[] }>(
    "/dashboard/segment-performance",
    { weeks: String(weeks) },
  );
  return result?.segments ?? null;
}

export async function fetchOptimizationSuggestions() {
  const result = await forShop<{ suggestions: OptimizationSuggestion[] }>(
    "/dashboard/optimization-suggestions",
  );
  return result?.suggestions ?? null;
}

export async function fetchRules() {
  return forShop<{
    nudgeRules: NudgeRuleRow[];
    suppressionRules: SuppressionRuleRow[];
  }>("/dashboard/rules");
}

/** Postgres returns NUMERIC as a string over JSON; every rate/percent needs this. */
export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}
