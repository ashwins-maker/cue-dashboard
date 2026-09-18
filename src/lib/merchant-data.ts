// Placeholder merchant-facing data for the dashboard UI.
//
// Shaped like what the widget will emit once logging is in place, so the screens
// do not need to change when it is swapped for real queries.
//
// Vocabulary note: a row is a FRICTION POINT, not a "question". Only a minority
// of rows were typed by a shopper; the rest are inferred from behaviour, and
// calling those questions would put words in shoppers' mouths.

export type SignalSource =
  | "direct" // typed into the widget's ask box — verbatim
  | "topic" // opened a topic in the widget — self-declared
  | "abandoned" // opened the widget, selected nothing, left
  | "behavioural"; // inferred from behaviour alone — the weakest evidence

export type ContentState =
  | "covered" // the store has the content and the widget uses it
  | "low_confidence" // answered, but from very little source material
  | "uncovered"; // the store has nothing to say — the content gap

export type TopicKey =
  | "fit"
  | "size"
  | "fabric"
  | "colour"
  | "care"
  | "returns"
  | "delivery"
  | "stock"
  | "reviews";

export const TOPIC_LABEL: Record<TopicKey, string> = {
  fit: "Fit & shape",
  size: "Size & measurements",
  fabric: "Fabric & composition",
  colour: "Colour & wash",
  care: "Washing & care",
  returns: "Returns & exchanges",
  delivery: "Delivery & shipping",
  stock: "Stock & availability",
  reviews: "Customer reviews",
};

export const SOURCE_LABEL: Record<SignalSource, string> = {
  direct: "Direct question",
  topic: "Topic opened",
  abandoned: "Opened, no selection",
  behavioural: "Behavioural",
};

export const SOURCE_DESCRIPTION: Record<SignalSource, string> = {
  direct: "Typed into the widget. Recorded verbatim.",
  topic: "Opened this topic in the widget. Self-declared.",
  abandoned: "Opened the widget, selected nothing, left the page.",
  behavioural: "Inferred from behaviour. No shopper stated this.",
};

export const CONTENT_LABEL: Record<ContentState, string> = {
  covered: "Covered",
  low_confidence: "Low confidence",
  uncovered: "Not covered",
};

export interface FrictionPoint {
  id: string;
  /** Neutral description of what shoppers could not resolve. */
  summary: string;
  /** Verbatim phrasings, present only when the source is `direct`. */
  verbatim?: string[];
  topic: TopicKey;
  productId: string;
  productTitle: string;
  productPrice: number;
  source: SignalSource;
  /** Distinct anonymous sessions in the selected period. */
  sessions: number;
  /** Change against the previous period. A fall is the desired direction. */
  trend: { direction: "up" | "down"; value: string };
  contentState: ContentState;
  /** The line the widget serves, when the store has one. */
  answer?: string;
  /** The store content that line was built from. Never absent when `answer` is. */
  evidence?: string;
  /** Conversion for sessions where this friction point occurred. */
  conversion: number;
  /** Conversion for comparable sessions on the same product. */
  baseline: number;
  /** Return rate on orders from these sessions. Null until the nightly sync lands. */
  returnRate: number | null;
  /** The catalog change that would remove this friction point. */
  recommendation: string;
}

export const STORE = {
  name: "Drover Denim",
  domain: "drover-denim.myshopify.com",
  period: "Last 30 days",
  tracking: "active" as const,
  lastEvent: "12 seconds ago",
  consentDeniedShare: 0.18,
};

/**
 * What every change indicator is measured against.
 *
 * An arrow and a percentage on their own are an assertion with no baseline —
 * "+18%" against last month, last week, or target reads identically and means
 * three different things. Derived from STORE.period so the two can never
 * disagree.
 */
export const PERIOD_COMPARISON = `vs previous ${STORE.period.replace(/^Last /, "")}`;

/**
 * One entry per soft metric. `label` says what the number IS in plain words;
 * `body` says how it is worked out and the single caveat that matters. Kept
 * in one place so the same explanation cannot drift between screens.
 */
export const METRIC_NOTES = {
  netRevenueAdded: {
    label: "Measured against a held-back group",
    body: "A random slice of shoppers never sees Cue at all. We compare revenue per session between the two groups and multiply the difference by the number who did see it, so sales that would have happened anyway are not counted. Returns are netted off, because a sale that comes back is not a win — the held-back group returns more often, and that gap is part of this figure rather than additional to it. Not yet measured: an order carries no record of which group the shopper was in.",
  },
  intentWorth: {
    label: "What settling this question is worth",
    body: "Net revenue added, split by the question that triggered the card. Same held-back comparison as the overview total, so the six add up to it. The ranking is the point: a question shoppers ask often is not automatically the one worth answering. Not yet measured: an order carries no record of which group the shopper was in, or which question they had.",
  },
  demandAnswered: {
    label: "How often shoppers got stuck, and how often it was settled",
    body: "One count per visit where a shopper hesitated over something, no matter how many times it happened in that visit. The share is how often Cue answered and the hesitation stopped — they stopped flipping sizes, reopening the size chart, or hunting for the returns policy. The count falling is the goal: a question that stops being asked has been answered on the page.",
  },
  revenueAtRisk: {
    label: "Sales you are probably losing",
    body: "These shoppers buy less often than others looking at the same product. We take that gap, multiply by how many of them there are, and multiply by the price. A rough estimate, not a measured loss.",
  },
  conversionComparison: {
    label: "How often these shoppers buy",
    body: "Orders as a share of these sessions, shown against the rate for other shoppers on the same product. They were not split at random, so read the gap as a clue rather than proof.",
  },
  returnRate: {
    label: "How often this product comes back",
    body: "Refunded units as a share of units ordered, for the whole product over the period. Shopify's order webhook carries no session id, so this is not limited to the shoppers who hit this friction point. Returns arrive weeks after the sale, so recent weeks will still climb.",
  },
  sessions: {
    label: "How many shoppers hit this",
    body: `Counted once per visit, no matter how many times it happened in that visit. Visitors who declined tracking are not counted — ${Math.round(STORE.consentDeniedShare * 100)}% of your traffic.`,
  },
  resolved: {
    label: "Fixed for good",
    body: "You added the answer to the product page and shoppers stopped getting stuck on it. Cue no longer has to say it, so it drops off this list.",
  },
  holdout: {
    label: "Why this number is trustworthy",
    body: "One in five matching shoppers is shown nothing at all, picked at random. Comparing the two groups is how we know the difference came from Cue and not from something else.",
  },
} as const;

export const FRICTION_POINTS: FrictionPoint[] = [
  {
    id: "fp-shrink",
    summary: "Whether the denim shrinks after washing",
    verbatim: [
      "does it shrink",
      "will these shrink in the wash",
      "shrinkage?",
      "do they shrink if i tumble dry",
    ],
    topic: "care",
    productId: "gid://shopify/Product/1002",
    productTitle: "High-Rise Wide Leg Jean",
    productPrice: 88,
    source: "direct",
    sessions: 412,
    trend: { direction: "up", value: "+34%" },
    contentState: "uncovered",
    conversion: 0.111,
    baseline: 0.243,
    returnRate: 0.19,
    recommendation:
      "Add a shrinkage line to the care metafield — rigid cotton, pre-washed or not.",
  },
  {
    id: "fp-thigh",
    summary: "How the leg sits through the thigh",
    verbatim: ["thigh", "is it tight on the thigh", "room in the leg"],
    topic: "fit",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    productPrice: 78,
    source: "direct",
    sessions: 288,
    trend: { direction: "down", value: "−12%" },
    contentState: "low_confidence",
    answer:
      "Mixed, across 4 reviews that talk about fit. Thigh is cut close. Listed fit: true to size.",
    evidence: "4 reviews that mention fit",
    conversion: 0.207,
    baseline: 0.243,
    returnRate: 0.11,
    recommendation:
      "Add a thigh measurement to the size chart — 4 reviews is too little to answer this.",
  },
  {
    id: "fp-size-up",
    summary: "Which size to take in this fit",
    topic: "size",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    productPrice: 78,
    source: "behavioural",
    sessions: 1204,
    trend: { direction: "down", value: "−41%" },
    contentState: "covered",
    answer: "Runs small in the waist. Most people size up one.",
    evidence:
      "17 of 24 reviews that mention fit, plus 14 exchanges for a size up",
    conversion: 0.312,
    baseline: 0.243,
    returnRate: 0.04,
    recommendation:
      "Promote to the product description — this answer has held for 6 weeks.",
  },
  {
    id: "fp-wash-colour",
    summary: "Whether the indigo is as dark as the photography",
    verbatim: ["is it this blue in real life", "colour accurate?"],
    topic: "colour",
    productId: "gid://shopify/Product/1002",
    productTitle: "High-Rise Wide Leg Jean",
    productPrice: 88,
    source: "direct",
    sessions: 196,
    trend: { direction: "up", value: "+8%" },
    contentState: "uncovered",
    conversion: 0.152,
    baseline: 0.221,
    returnRate: null,
    recommendation:
      "No daylight photography and no wash description. Add one of the two.",
  },
  {
    id: "fp-stretch",
    summary: "Whether the fabric stretches out during wear",
    topic: "fabric",
    productId: "gid://shopify/Product/1003",
    productTitle: "Skinny Stretch Jean",
    productPrice: 68,
    source: "topic",
    sessions: 341,
    trend: { direction: "down", value: "−6%" },
    contentState: "covered",
    answer:
      "92% cotton with 2% elastane. Has stretch and holds its shape through the day.",
    evidence: "the fabric composition on this product",
    conversion: 0.284,
    baseline: 0.259,
    returnRate: 0.07,
    recommendation: "Already on the page. No action.",
  },
  {
    id: "fp-exchange",
    summary: "What happens if the size is wrong",
    topic: "returns",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    productPrice: 78,
    source: "topic",
    sessions: 523,
    trend: { direction: "down", value: "−18%" },
    contentState: "covered",
    answer: "Free exchanges within 30 days if the size is wrong.",
    evidence: "this store's returns policy",
    conversion: 0.298,
    baseline: 0.243,
    returnRate: 0.09,
    recommendation:
      "Promote to the price block — shoppers should not have to look for this.",
  },
  {
    id: "fp-rise",
    summary: "The rise measurement",
    verbatim: ["rise", "front rise in inches", "how high is the waist"],
    topic: "size",
    productId: "gid://shopify/Product/1003",
    productTitle: "Skinny Stretch Jean",
    productPrice: 68,
    source: "direct",
    sessions: 312,
    trend: { direction: "up", value: "+21%" },
    contentState: "uncovered",
    conversion: 0.138,
    baseline: 0.259,
    returnRate: 0.16,
    recommendation: "Rise is missing from the size chart on 12 products. Add it.",
  },
  {
    id: "fp-restock",
    summary: "Whether a sold-out size will return",
    topic: "stock",
    productId: "gid://shopify/Product/1003",
    productTitle: "Skinny Stretch Jean",
    productPrice: 68,
    source: "behavioural",
    sessions: 174,
    trend: { direction: "up", value: "+3%" },
    contentState: "uncovered",
    conversion: 0.046,
    baseline: 0.259,
    returnRate: null,
    recommendation:
      "No restock dates in the catalog. Connect them, or add a back-in-stock signup.",
  },
  {
    id: "fp-model",
    summary: "Model height and the size worn",
    topic: "fit",
    productId: "gid://shopify/Product/1002",
    productTitle: "High-Rise Wide Leg Jean",
    productPrice: 88,
    source: "topic",
    sessions: 268,
    trend: { direction: "down", value: "−9%" },
    contentState: "covered",
    answer: "Worn by a 168cm model in size 26.",
    evidence: "this product's model metafield",
    conversion: 0.266,
    baseline: 0.221,
    returnRate: 0.06,
    recommendation: "Already on the page. No action.",
  },
  {
    id: "fp-delivery",
    summary: "Expected delivery date",
    topic: "delivery",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    productPrice: 78,
    source: "abandoned",
    sessions: 143,
    trend: { direction: "up", value: "+2%" },
    contentState: "low_confidence",
    answer: "Standard delivery, 3–5 working days.",
    evidence: "the shipping policy page",
    conversion: 0.231,
    baseline: 0.243,
    returnRate: null,
    recommendation:
      "The policy carries no per-region estimate, so the answer stays vague.",
  },
];

/** Which topics the catalog can fill. Known from the store alone, before traffic. */
export interface CoverageRow {
  topic: TopicKey;
  productsCovered: number;
  productsTotal: number;
  sessionsSeeking: number;
}

export const COVERAGE: CoverageRow[] = [
  { topic: "fit", productsCovered: 41, productsTotal: 48, sessionsSeeking: 2140 },
  { topic: "size", productsCovered: 36, productsTotal: 48, sessionsSeeking: 1866 },
  { topic: "fabric", productsCovered: 48, productsTotal: 48, sessionsSeeking: 903 },
  { topic: "returns", productsCovered: 48, productsTotal: 48, sessionsSeeking: 741 },
  { topic: "reviews", productsCovered: 44, productsTotal: 48, sessionsSeeking: 688 },
  { topic: "delivery", productsCovered: 48, productsTotal: 48, sessionsSeeking: 402 },
  { topic: "colour", productsCovered: 12, productsTotal: 48, sessionsSeeking: 388 },
  { topic: "care", productsCovered: 8, productsTotal: 48, sessionsSeeking: 517 },
  { topic: "stock", productsCovered: 0, productsTotal: 48, sessionsSeeking: 174 },
];

export const SUPPRESSION = {
  total: 14238,
  reasons: [
    { label: "No store content available", count: 6104 },
    { label: "Already resolved by the shopper", count: 3921 },
    { label: "Held back to measure impact", count: 2680 },
    { label: "No tracking consent", count: 1533 },
  ],
};

/** Sessions × conversion shortfall × price. A modelled figure, always labelled. */
export function revenueAtRisk(point: FrictionPoint): number {
  const shortfall = Math.max(0, point.baseline - point.conversion);
  return point.sessions * shortfall * point.productPrice;
}

/**
 * Store-wide revenue at risk.
 *
 * Scoped to friction points the store has no content for, because that is the
 * figure a merchant can act on: the other rows already have an answer on the
 * page. Both the overview and the friction-point list call this rather than
 * summing themselves, so the two screens cannot drift apart.
 */
export function revenueAtRiskTotal(points: FrictionPoint[]): number {
  return points
    .filter((point) => point.contentState === "uncovered")
    .reduce((sum, point) => sum + revenueAtRisk(point), 0);
}

export function formatCurrency(value: number): string {
  // Nothing is at risk when these sessions convert at or above the comparison —
  // "$0" reads like a measurement, an em dash reads as not applicable.
  if (value < 1) return "—";
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
