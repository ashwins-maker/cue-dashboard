# Cue — required items

Work list for [`Manukris-kv/Cue`](https://github.com/Manukris-kv/Cue), verified against
commit `171d4e3` (2026-09-18).

Everything here was checked against source, migrations, and every `emit()` call site —
not against the repo's own docs. Items already closed by `a3eccca` and `e1f02b2` are in
[`cue-requirements-status.md`](./cue-requirements-status.md) and are not repeated here.

---

## Closed by `171d4e3`

Seven items, in one commit that cites this file by name.

| Item | What shipped |
|---|---|
| **D1–D4** | Migration `0015_wire_dead_signals.sql` seeds all four missing routing rows: `zoom → size_guide` (2+ zooms in the window), `colour_variant_change → reassurance` (2+ changes), `scroll_reversal → size_guide` (3+ reversals), `multi_tab_same_product → reassurance` (unconditional, matching `multi_tab_compare`) |
| **C2** | Migration `0016` adds `nudge_performance_insights.triggering_signals TEXT[]` — the distinct set of signal types folded into each insight row, so the per-intent breakdown has data at the rollup level and not only in the raw feed |
| **A2** | `checkout_started` emitted on the real checkout click with `cartValue` and `itemCount`. Value stays in minor currency units on purpose: the exponent is not knowable in the SDK |
| **A3** | `cart_remove` emitted, with size-swap sources excluded so a swap counts as neither an add nor a remove |

Also landed, not on this list: `card_content` now returns `sourceChunkIds`, so a
generated line can be traced back to the indexed store content behind it.

**Two caveats on D1–D4.** `zoom` and `colour_variant_change` are routed to
existing card types because no fabric or colour card exists yet — the gate is
real, the copy is generic. That is B2 and B5 below, still open.

---

## A. Data capture

| # | Item | Blocks | Fix |
|---|---|---|---|
| A1 | **Session attribution on orders** | Return rate per nudge or per friction point · order-based lift · assisted orders · revenue attribution | Inject `session_id` as a cart note attribute at add-to-cart, read it back off `ORDERS_CREATE` |
| A4 | **`zero_result_filter` emitted** | Stock intent. **A nudge rule is already seeded for it, so it is dead today** | Collection / filter-page detection |
| A5 | **`filter_applied` emitted** | Size intent — filtering the collection by size | Same collection-page work as A4 |
| A6 | **`pinch_zoom`, `video_engagement`** | Fabric and fit detection | Mobile gesture listener; video progress listener |
| A7 | **`collection_pdp_loop`** | Comparison intent | Cross-page session state |
| A8 | **`image_load_failure`** | The fabric silence rule — do not answer colour questions to shoppers whose photos never loaded | Image error listener |
| A9 | **`known_size_history`, `prior_return_reason`** | `repeat_buyer_same_fit` — the suppression rule exists and **always no-ops** | Logged-in customer detection, then a nightly join against `Customer.orders` |
| A10 | **Return reason codes** | Ranking confusions by what they actually cost — the intents doc's own proposed validation | Shopify's refund payload carries none; the merchant's return flow must collect and forward it |

## B. Schema and content

| # | Item | Blocks | Fix |
|---|---|---|---|
| B1 | **Measurement metafields** — rise, inseam, leg opening | Intent 2's measurement copy · Intent 5's size delta · Intent 6's side-by-side. Confirmed absent by direct query | Define the schema, populate per product |
| B2 | **Fabric card type** | Fabric now has real content and no card of its own — the facts ride inside `size_guide` / `reassurance` | Add to `CardType` and the generation prompts |
| B3 | **Comparison card type + shared-fields-only rule** | Intent 6. Missing data is a silent recommendation: blanks favour the better-documented product | Show a row only when the field exists on both; drop the row otherwise; say nothing if no rows remain |
| B4 | **Size-delta card type** | Intent 5's actual copy. It currently serves the generic size card | Compute deltas from the size chart |
| B5 | **Colour and care card types** | Four of the nine topics the dashboard shows have no card behind them | Extend `CardType` |
| B6 | **Evidence-strength score on generated cards** | "Low confidence" — a card built from 4 reviews looks identical to one built from 240 | Store a source-strength value alongside each card |
| B7 | **Promotion record** | "Resolved" / "Fixed for good" — the headline metric can never be computed | A table recording that an answer was added to a product page |
| B8 | **Restock dates** | Stock intent, whose answer is otherwise always "no" | Catalog field |

## C. Aggregation and endpoints

| # | Item | Blocks | Fix |
|---|---|---|---|
| C1 | **Period-over-period comparison** | Every trend arrow. **Falling demand is the product's core claim and is still unmeasurable** | Diff each insight row against the preceding window in the digest job |
| C3 | **Feed endpoint over `nudge_shown_log`** | The Nudges page feed | New route |
| C4 | **Suppression breakdown endpoint** | The "when it stayed quiet" table | Grouped count over `suppression_log` |
| C5 | **Catalog coverage query** | Content gaps and topic coverage | `products` × `product_metafields` × `card_content` |
| C6 | **Session timeline endpoint** | "What customers are doing" | Query over `events` |
| C7 | **Real segment dimensions** | Segment performance, and it narrows what the bandit can learn — `buildSegmentKey` is called with `isReturning: false, cartValue: 0` | Feed real returning-visitor and cart-value state in |

## D. Rules

All four dead signals were wired by `0015`. Nothing outstanding here.

## E. Platform and operations

| # | Item | Severity |
|---|---|---|
| E1 | **`/dashboard/*` authentication** — routes trust a client-supplied `shopId` with no verification | Blocks onboarding a second merchant |
| E2 | **Rate limiting** — none anywhere, including an unauthenticated `/chat` that triggers per-token LLM calls | Real cost-abuse vector |
| E3 | **Widget bundle at 14.78kb against a 15kb budget** | 0.22kb of headroom, down from 0.30kb. The next widget feature breaks it outright |
| E4 | **Existing installs must re-consent** — `read_orders` is not retroactive | The real store receives no order data until OAuth is re-run |
| E5 | **Chat transcript retention policy** | `chat_questions` and `chat_escalations` hold free text indefinitely; `events` has a TTL, these do not |

---

## The five that unblock the most

1. **A1 — session attribution on orders.** Unlocks every returns and revenue figure in the dashboard, and the product's own quality bar: a fit nudge that sells but comes back has failed.
2. **B1 — measurement metafields.** Three of the six intents cannot state their real copy without it.
3. **C1 — period comparison.** The headline claim — demand falling as answers get promoted onto the page — is currently unmeasurable.
4. **B2 — a fabric card type.** `zoom` now fires, but serves the generic size card. The content and the trigger both exist; the card does not.
5. **E1 — dashboard authentication.** Nothing ships to a second merchant until this is closed.
