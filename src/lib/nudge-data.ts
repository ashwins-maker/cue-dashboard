// Placeholder data for the Nudges page, shaped to the Cue backend so the screen
// swaps to live queries without a rewrite.
//
// Row shapes mirror, field for field:
//   nudge_shown_log  — id, card_type, variant_label, triggering_signals[], shown_at, outcome JSONB
//   suppression_log  — candidate_card_type, reason
//   card_content     — content_text, variant_label
//
// Intents are this dashboard's layer, not the backend's: Cue routes signals
// straight to a card_type. The mapping below is what turns five card types back
// into the six intents the product is actually described in.

/** The five card types the backend generates. Nothing else can be served. */
export type CardType =
  | "size_guide"
  | "shipping_info"
  | "stock_urgency"
  | "reassurance"
  | "back_in_stock_prompt";

export type IntentKey =
  | "size"
  | "fit"
  | "fabric"
  | "return_risk"
  | "bracketing"
  | "comparison";

/** One seeded row of `nudge_rules`, as the backend actually holds it. */
export interface IntentRule {
  signal: string;
  cardType: CardType;
  /** The `conditions` JSONB gate, in words. Absent means no condition. */
  condition?: string;
}

export interface Intent {
  key: IntentKey;
  label: string;
  /** The shopper's question, as the intents doc frames it. */
  question: string;
  /** What the shopper actually does, in a merchant's words, not signal names. */
  behaviour: string;
  /** An example of the line Cue serves, from the intents doc. */
  example: string;
  /** The navigational action on that card, if any. Never a recommendation. */
  action?: string;
  /** When Cue holds back, in plain words. */
  quietWhen: string;
  /** Every rule that fires this intent. */
  rules: IntentRule[];
  /** Suppression rules that veto it. */
  silenceRules: string[];
  /** Named in the requirements, not implemented. */
  notImplemented: string[];
  /** What counts as this intent resolving — measured from post_nudge_* events. */
  winsWhen: string;
}

export const INTENTS: Record<IntentKey, Intent> = {
  size: {
    key: "size",
    label: "Size uncertainty",
    question: "Which size am I in this brand?",
    behaviour: "Flips between sizes without picking one",
    example: '"38 of 47 reviewers said this runs small in the waist."',
    action: "Open size chart",
    quietWhen: "Already added to cart, or already read the size chart properly",
    rules: [
      {
        signal: "variant_change",
        cardType: "size_guide",
        condition: "3+ size flips inside the 20-second window",
      },
      { signal: "cart_size_swap", cardType: "size_guide" },
      { signal: "quantity_increase_same_item", cardType: "size_guide" },
      {
        signal: "review_filter_applied",
        cardType: "size_guide",
        condition: "filterType is size or fit",
      },
    ],
    silenceRules: ["already_added_to_cart", "size_chart_read_thorough"],
    notImplemented: [
      "Returns to a size already tried",
      "Filters the collection by size (filtering reviews is covered)",
    ],
    winsWhen: "Size flipping stops and a size is chosen",
  },
  fit: {
    key: "fit",
    label: "Fit and shape",
    question: "Will this shape work on my body?",
    behaviour: "Opens the size guide, closes it, picks nothing",
    example: '"Rise 11in, inseam 30in, leg opening 14in. Model is 173cm in a 28."',
    action: "See measurements",
    quietWhen: "Bought this fit before, or a screen reader is in use",
    rules: [
      {
        signal: "size_guide_close",
        cardType: "reassurance",
        condition: "opened it, closed it, picked nothing",
      },
      {
        signal: "accordion_open",
        cardType: "size_guide",
        condition: "section is fit",
      },
      {
        signal: "dwell",
        cardType: "size_guide",
        condition: "blockType is description and 5s+",
      },
      {
        signal: "scroll_reversal",
        cardType: "size_guide",
        condition: "3+ scroll-backs to re-read a section",
      },
    ],
    silenceRules: ["repeat_buyer_same_fit", "assistive_tech_active"],
    notImplemented: ["Replays the product video — no signal exists"],
    winsWhen: "The hunting stops and a size is chosen",
  },
  fabric: {
    key: "fabric",
    label: "Material and fabric",
    question: "How will it behave when worn?",
    behaviour: "Reads the composition, selects the text, opens the care section",
    example: '"98% cotton, 2% elastane. 12 of 14 reviewers mentioned stretch."',
    quietWhen: "Never — no rule holds this one back",
    rules: [
      {
        signal: "text_selection",
        cardType: "size_guide",
        condition: "nearBlockType is composition or measurement",
      },
      {
        signal: "accordion_open",
        cardType: "shipping_info",
        condition: "section is care",
      },
      {
        signal: "dwell",
        cardType: "size_guide",
        condition: "description dwell also catches fabric-adjacent reading",
      },
      {
        signal: "zoom",
        cardType: "size_guide",
        condition: "2+ zooms of the fabric inside the window",
      },
    ],
    silenceRules: [],
    notImplemented: [
      "Pinch-zoom — only click-zoom is tracked",
      "No fabric card type, so zoom serves the generic size card",
      "Review-mined stretch and rigidity as a dedicated trigger",
    ],
    winsWhen: "The fabric zooming stops",
  },
  return_risk: {
    key: "return_risk",
    label: "Return risk",
    question: "What happens if I am wrong?",
    behaviour: "Leaves for the returns page and comes back, or sits in the cart",
    example: '"Free exchanges within 30 days, tags attached."',
    quietWhen: "Added to cart quickly, with no sign of hesitation",
    rules: [
      {
        signal: "policy_page_nav",
        cardType: "shipping_info",
        condition: "returnedToProduct is true — they actually came back",
      },
      {
        signal: "cart_dwell_before_checkout",
        cardType: "reassurance",
        condition: "30s+ in the cart",
      },
      {
        signal: "atc_approach_count",
        cardType: "shipping_info",
        condition: "approached the buy button 2+ times",
      },
      { signal: "checkout_back_to_pdp", cardType: "reassurance" },
      {
        signal: "accordion_open",
        cardType: "shipping_info",
        condition: "section is returns or shipping",
      },
      {
        signal: "help_seeking_nav",
        cardType: "shipping_info",
        condition: "FAQ; contact and live chat route to reassurance",
      },
    ],
    silenceRules: ["fast_confident_atc"],
    notImplemented: [],
    winsWhen: "Checkout happens without re-reading the policy",
  },
  bracketing: {
    key: "bracketing",
    label: "Bracketing",
    question: "Shall I buy both and send one back?",
    behaviour: "Puts two sizes of the same item in the cart",
    example: '"The 30 is 1in wider at the waist. Same inseam."',
    quietWhen: "Never — no rule holds this one back",
    rules: [
      {
        signal: "multi_size_cart",
        cardType: "size_guide",
        condition: "two variants of the same product in the cart",
      },
      { signal: "quantity_increase_same_item", cardType: "size_guide" },
      { signal: "cart_size_swap", cardType: "size_guide" },
    ],
    silenceRules: [],
    notImplemented: [
      "No clearly-separate-products suppression — unrelated multi-item carts are not told apart",
      "Copy is generic; no measurement-delta data exists",
    ],
    winsWhen: "One of the two sizes leaves the cart",
  },
  comparison: {
    key: "comparison",
    label: "Comparison",
    question: "Which of these two is right?",
    behaviour: "Bounces between two products, or opens both in tabs",
    example: '"Rise 11in vs 12.5in. Leg opening 14in vs 22in."',
    action: "Show side by side",
    quietWhen: "Never — no rule holds this one back",
    rules: [
      {
        signal: "product_comparison",
        cardType: "reassurance",
        condition: "same-tab A to B to A",
      },
      {
        signal: "multi_tab_compare",
        cardType: "reassurance",
        condition: "cross-tab, via BroadcastChannel",
      },
      {
        signal: "multi_tab_same_product",
        cardType: "reassurance",
        condition: "same product in two tabs, at different sizes",
      },
    ],
    silenceRules: [],
    notImplemented: [
      "No suppression for only one product viewed",
      "No comparability test — jeans vs a belt is not excluded",
      "Copy is generic; same measurement-delta gap",
    ],
    winsWhen: "A decision is made either way, rather than leaving undecided",
  },
};


/**
 * One row of `nudge_shown_log`, column for column, with the `outcome` JSONB
 * exactly as `nudge-shown-log-repo.ts` merges it. Nothing here is invented:
 * every field below is written by a named event handler in that file.
 */
export interface NudgeFiring {
  /** The client-generated nudgeShownLogId — the row's primary key. */
  id: string;
  intent: IntentKey;
  cardType: CardType;
  variantLabel: string;
  triggeringSignals: string[];
  /** buildSegmentKey() — device type only today, the rest is hardcoded. */
  segmentKey: string;
  shownAt: string;
  sessionId: string;
  /** Column added in migration 0011, relaxed to TEXT in 0014. */
  productId: string;
  productTitle: string;
  /** card_content.content_text with live placeholders filled. */
  contentText: string;
  outcome: {
    /** nudge_impression — viewport-confirmed, not DOM insertion. */
    impression?: boolean;
    impressionAt?: string;
    /** nudge_time_visible */
    timeVisibleMs?: number;
    /** nudge_read_time — gap before the next action. */
    readTimeMs?: number;
    /** nudge_action_click */
    actionClicked?: boolean;
    actionId?: string;
    /** nudge_dismiss */
    dismissed?: boolean;
    dismissMethod?: string;
    /** nudge_ignored */
    ignored?: boolean;
    /** nudge_keyboard_use */
    keyboardUsed?: boolean;
    /** The post_nudge_* events, within the attribution window. */
    postNudge?: {
      variantChangeCountBefore?: number;
      variantChangeCountAfter?: number;
      sizeGuideReopened?: boolean;
      policyNavAgain?: boolean;
      msToAddToCart?: number;
      exitedAfter?: boolean;
    };
    /**
     * Written only when an outcome event carries a nudgeShownLogId.
     * `add_to_cart` never sets one (attribution was left out of the emit),
     * and `order_completed` is never emitted — so this stays empty today.
     */
    conversion?: {
      addedToCart?: boolean;
      checkoutStarted?: boolean;
      orderCompleted?: boolean;
      orderValue?: number;
    };
  };
}

export const FIRINGS: NudgeFiring[] = [
  {
    id: "nsl-8f21",
    intent: "size",
    cardType: "size_guide",
    variantLabel: "B",
    triggeringSignals: ["variant_change"],
    segmentKey: "desktop|new|0",
    shownAt: "2 minutes ago",
    sessionId: "s_4f9c21",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    contentText: "Runs small in the waist. Most people size up one.",
    outcome: {
      impression: true,
      impressionAt: "2 minutes ago",
      timeVisibleMs: 7400,
      readTimeMs: 2600,
      actionClicked: true,
      actionId: "open_size_chart",
      postNudge: { variantChangeCountBefore: 4, variantChangeCountAfter: 0 },
    },
  },
  {
    id: "nsl-7c04",
    intent: "bracketing",
    cardType: "size_guide",
    variantLabel: "A",
    triggeringSignals: ["multi_size_cart"],
    segmentKey: "mobile|new|0",
    shownAt: "11 minutes ago",
    sessionId: "s_71ab08",
    productId: "gid://shopify/Product/1002",
    productTitle: "High-Rise Wide Leg Jean",
    contentText: "Runs true to size through the waist and hip.",
    outcome: {
      impression: true,
      timeVisibleMs: 3100,
      readTimeMs: 900,
      dismissed: true,
      dismissMethod: "close_button",
      postNudge: { exitedAfter: false },
    },
  },
  {
    id: "nsl-6b93",
    intent: "return_risk",
    cardType: "shipping_info",
    variantLabel: "A",
    triggeringSignals: ["policy_page_nav", "atc_approach_count"],
    segmentKey: "desktop|new|0",
    shownAt: "24 minutes ago",
    sessionId: "s_2d7e55",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    contentText: "Free exchanges within 30 days if the size is wrong.",
    outcome: {
      impression: true,
      timeVisibleMs: 5200,
      readTimeMs: 4100,
      postNudge: { policyNavAgain: false },
    },
  },
  {
    id: "nsl-5a17",
    intent: "fit",
    cardType: "reassurance",
    variantLabel: "C",
    triggeringSignals: ["size_guide_close"],
    segmentKey: "desktop|new|0",
    shownAt: "38 minutes ago",
    sessionId: "s_9e13c7",
    productId: "gid://shopify/Product/1002",
    productTitle: "High-Rise Wide Leg Jean",
    contentText:
      "Rise 12.5in, inseam 32in, leg opening 22in. Model is 168cm in a 26.",
    outcome: {
      impression: true,
      timeVisibleMs: 11800,
      readTimeMs: 5400,
      actionClicked: true,
      actionId: "see_measurements",
      keyboardUsed: true,
      postNudge: { sizeGuideReopened: false },
    },
  },
  {
    id: "nsl-9a40",
    intent: "fabric",
    cardType: "size_guide",
    variantLabel: "A",
    triggeringSignals: ["text_selection"],
    segmentKey: "mobile|new|0",
    shownAt: "47 minutes ago",
    sessionId: "s_6cd104",
    productId: "gid://shopify/Product/1003",
    productTitle: "Skinny Stretch Jean",
    contentText:
      "92% cotton with 2% elastane. Has stretch and holds its shape through the day.",
    outcome: {
      impression: true,
      timeVisibleMs: 6100,
      readTimeMs: 3300,
      postNudge: { exitedAfter: false },
    },
  },
  {
    id: "nsl-4d88",
    intent: "size",
    cardType: "size_guide",
    variantLabel: "B",
    triggeringSignals: ["variant_change", "cart_size_swap"],
    segmentKey: "mobile|new|0",
    shownAt: "52 minutes ago",
    sessionId: "s_bb40f2",
    productId: "gid://shopify/Product/1003",
    productTitle: "Skinny Stretch Jean",
    contentText: "Runs large. Most people size down one.",
    outcome: {
      impression: true,
      timeVisibleMs: 1900,
      ignored: true,
      postNudge: { variantChangeCountBefore: 3, variantChangeCountAfter: 2, exitedAfter: true },
    },
  },
  {
    id: "nsl-3f02",
    intent: "comparison",
    cardType: "reassurance",
    variantLabel: "A",
    triggeringSignals: ["product_comparison", "multi_tab_compare"],
    segmentKey: "desktop|new|0",
    shownAt: "1 hour ago",
    sessionId: "s_c7f991",
    productId: "gid://shopify/Product/1001",
    productTitle: "Mid-Rise Straight Jean",
    contentText: "Free exchanges within 30 days, tags attached.",
    outcome: {
      impression: true,
      timeVisibleMs: 2600,
      dismissed: true,
      dismissMethod: "escape_key",
      postNudge: { exitedAfter: true },
    },
  },
  {
    id: "nsl-2e55",
    intent: "return_risk",
    cardType: "reassurance",
    variantLabel: "B",
    triggeringSignals: ["cart_dwell_before_checkout"],
    segmentKey: "desktop|new|0",
    shownAt: "1 hour ago",
    sessionId: "s_18aa3d",
    productId: "gid://shopify/Product/1003",
    productTitle: "Skinny Stretch Jean",
    contentText: "Free exchanges within 30 days if the size is wrong.",
    outcome: {
      impression: true,
      timeVisibleMs: 4400,
    },
  },
];

/**
 * Reads the post_nudge_* fields the way the intent's own success condition
 * defines it. Nothing is inferred beyond what those events recorded.
 */
export type Resolution = "resolved" | "unresolved" | "exited" | "pending";

export function resolutionOf(firing: NudgeFiring): {
  state: Resolution;
  evidence: string;
} {
  const post = firing.outcome.postNudge;
  if (!post) return { state: "pending", evidence: "No post-nudge events yet." };

  if (post.exitedAfter) {
    return { state: "exited", evidence: "post_nudge_exit fired." };
  }

  if (
    post.variantChangeCountBefore !== undefined &&
    post.variantChangeCountAfter !== undefined
  ) {
    const stopped = post.variantChangeCountAfter === 0;
    return {
      state: stopped ? "resolved" : "unresolved",
      evidence: `Size changes went from ${post.variantChangeCountBefore} to ${post.variantChangeCountAfter}.`,
    };
  }

  if (post.sizeGuideReopened !== undefined) {
    return {
      state: post.sizeGuideReopened ? "unresolved" : "resolved",
      evidence: post.sizeGuideReopened
        ? "The size guide was opened again."
        : "The size guide was not opened again.",
    };
  }

  if (post.policyNavAgain !== undefined) {
    return {
      state: post.policyNavAgain ? "unresolved" : "resolved",
      evidence: post.policyNavAgain
        ? "The policy page was visited again."
        : "The policy page was not visited again.",
    };
  }

  return { state: "pending", evidence: "No resolution event for this intent." };
}

/** Aggregate per intent — what a rollup over nudge_shown_log would return. */
export interface IntentPerformance {
  intent: IntentKey;
  /**
   * Net revenue attributable to settling this question — the same
   * holdout-based figure the overview totals, split by intent. This is what
   * the intents doc asks for and nothing has produced until now: a ranking by
   * what each confusion actually costs, rather than by how loud it is.
   */
  worth: number;
  shown: number;
  engaged: number;
  actionClicked: number;
  dismissed: number;
  resolved: number;
  suppressed: number;
}

export const INTENT_PERFORMANCE: IntentPerformance[] = [
  { intent: "size", worth: 6500, shown: 4218, engaged: 1904, actionClicked: 1142, dismissed: 386, resolved: 2871, suppressed: 6104 },
  { intent: "return_risk", worth: 3150, shown: 1877, engaged: 602, actionClicked: 88, dismissed: 174, resolved: 1341, suppressed: 3110 },
  { intent: "fit", worth: 2820, shown: 2106, engaged: 1088, actionClicked: 704, dismissed: 201, resolved: 1402, suppressed: 2988 },
  { intent: "fabric", worth: 900, shown: 488, engaged: 194, actionClicked: 61, dismissed: 122, resolved: 208, suppressed: 736 },
  { intent: "bracketing", worth: 620, shown: 612, engaged: 318, actionClicked: 96, dismissed: 148, resolved: 214, suppressed: 402 },
  { intent: "comparison", worth: 210, shown: 244, engaged: 91, actionClicked: 0, dismissed: 63, resolved: 47, suppressed: 118 },
];

/**
 * Ranked by what settling each question is worth, not by a fixed taxonomy
 * order. The ranking is the finding: it reorders as the store changes, and it
 * is what decides which of the six are worth keeping.
 */
export const INTENTS_BY_WORTH: IntentPerformance[] = [...INTENT_PERFORMANCE].sort(
  (a, b) => b.worth - a.worth,
);

/** Shown, minus the ones where the hesitation carried on afterwards. */
export function leftUnsettled(perf: IntentPerformance): number {
  return Math.max(0, perf.shown - perf.resolved);
}

/**
 * suppression_log grouped by reason. Rule names are the backend's own, so a
 * merchant-facing label is attached rather than renaming them in the query.
 */
export interface SuppressionReason {
  rule: string;
  label: string;
  explanation: string;
  count: number;
}

export const SUPPRESSION_REASONS: SuppressionReason[] = [
  {
    rule: "no_content_available",
    label: "Your store had no answer",
    explanation:
      "Cue wanted to speak and your pages held nothing to say. The only reason on this list you can fix.",
    count: 1094,
  },
  {
    rule: "below_threshold",
    label: "Not confident enough",
    explanation: "Signals fired, but not strongly enough to be sure what was wanted.",
    count: 5402,
  },
  {
    rule: "already_added_to_cart",
    label: "Already added to cart",
    explanation: "The item was already in the cart. Interrupting a completed sale helps nobody.",
    count: 3921,
  },
  {
    rule: "control_holdout",
    label: "Held back to measure",
    explanation: "Deliberately shown nothing so there is a baseline to compare against.",
    count: 2680,
  },
  {
    rule: "size_chart_read_thorough",
    label: "Already found it",
    explanation: "The size chart was opened and read properly. The question was already answered.",
    count: 1544,
  },
  {
    rule: "prior_dismissal_same_type",
    label: "Dismissed before",
    explanation: "Dismissed this topic earlier. Asking again is nagging.",
    count: 891,
  },
  {
    rule: "fast_confident_atc",
    label: "No hesitation to answer",
    explanation: "Added to cart quickly with no sign of doubt.",
    count: 612,
  },
  {
    rule: "assistive_tech_active",
    label: "Screen reader in use",
    explanation: "Never interrupt someone mid-read. This rule overrides all others.",
    count: 118,
  },
];

export const SUPPRESSION_TOTAL = SUPPRESSION_REASONS.reduce(
  (sum, reason) => sum + reason.count,
  0,
);

export const NUDGE_TOTALS = {
  shown: 9057,
  engaged: 4003,
  actionClicked: 2030,
  dismissed: 972,
};

