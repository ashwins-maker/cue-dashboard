# Cue — what is still missing

Re-audited 2026-09-18 against [`Manukris-kv/Cue`](https://github.com/Manukris-kv/Cue) `e1f02b2`.

Every item below was verified against source, migrations, or the emitted-event list —
not against the repo's own docs. Ten gaps remain, grouped by what they block.

**Closed since the `ac99dce` baseline:** `add_to_cart` emission · `product_id` on both
log tables · `no_content_available` suppression reason · order and refund webhooks ·
full chat-question capture with clustering. See
[cue-requirements-status.md](cue-requirements-status.md) for that delta.

---

## Summary

| # | Gap | Blocks | Size |
|---|---|---|---|
| 1 | Insight rollup has no product dimension | Revenue at risk | **1 line** |
| 2 | No per-nudge order attribution | Whether a nudge sells but comes back | Medium |
| 3 | Return reasons always `unstated` | Ranking confusions by real cost | External |
| 4 | Signals emitted with no rule | Fabric and colour entirely | Small |
| 5 | Only five card types | Fabric, colour, care, comparison, size-delta | Medium |
| 6 | Signals never emitted | Specific intent detection | Small each |
| 7 | No period-over-period comparison | Every trend. **The core product claim** | Medium |
| 8 | No promotion record | "Resolved" / "Fixed for good" | Medium |
| 9 | `nightlyBatchFacts` never populated | One suppression rule, silently | Medium |
| 10 | Segment keys hardcoded | Segment analysis, bandit breadth | **2 lines** |
| 11 | No source-strength score | "Low confidence" | Small |

---

## 1. The insight rollup has no product dimension

`nudge_shown_log` now carries `product_id` (migration `0011`), but
`nudge_performance_insights` still groups by `card_type` and `variant_label` only.
Without a product on the insight row there is nothing to multiply a conversion
shortfall against.

**Blocks:** revenue at risk — the headline figure on Friction points.
**Fix:** add `product_id` to the group-by in `insights/nudge-performance.ts`.
**Size:** one line. Cheapest remaining win in the repo.

---

## 2. Orders cannot be attributed to a nudge

Shopify's `ORDERS_CREATE` payload carries no `session_id`, so an order cannot be tied
back to the session that saw the card. The repo is explicit that per-nudge attribution
is out of scope, and stores per-product aggregates instead.

**Blocks:** *"a fit nudge that sells but comes back has failed"* — unmeasurable at the
nudge level. Return rate is the product's rate over the period, not the rate for the
shoppers who hit a given friction point.
**Fix:** inject the session id as a cart attribute at add-to-cart, read it back off the
order line in `order-webhook-handlers.ts`.
**Note:** the dashboard must keep saying "whole product" until this lands. Anything
tighter is a claim the data does not support.

---

## 3. Return reasons are always `unstated`

Shopify's refund payload has no structured reason field. `product_returns.reason_code`
defaults to `unstated` and nothing ever overwrites it.

**Blocks:** the intents doc's own proposed validation — pull 90 days of returns with
stated reasons and rank the confusions by what they actually cost. That test still
cannot be run, so the six intents remain chosen by reasoning rather than data.
**Fix:** not ours. Needs the merchant's return flow to collect a reason and forward it.

---

## 4. Signals emitted, routed nowhere

Captured on every session, read by no rule.

| Signal | Would serve |
|---|---|
| `zoom` | Material / fabric — the whole intent |
| `colour_variant_change` | Colour accuracy |
| `scroll_reversal` | Fit and shape |
| `multi_tab_same_product` | Comparison, same product at two sizes |

`zoom` is the notable one: `fabric_composition` and `care_instructions` now reach card
generation, so the **content exists and nothing serves it**.

**Fix:** add rules. Needs gap 5 first for fabric and colour, since there is no card type
to route to.

---

## 5. Only five card types

`size_guide`, `shipping_info`, `stock_urgency`, `reassurance`, `back_in_stock_prompt`.

**Blocks:**
- **Fabric, colour, care, reviews** — four of the nine topics the dashboard shows
- **Comparison** — routes to the generic `reassurance` card
- **Bracketing** — routes to the generic `size_guide` card, so there is no
  *"the 30 is 1in wider at the waist, same inseam"*

`CardType` is `… | string`, so the type is extensible. The work is the generation
prompts and the rules.

---

## 6. Signals the spec names that nothing emits

| Signal | Blocks |
|---|---|
| `zero_result_filter` | Stock. **A rule is already seeded for it — dead rule** |
| `filter_applied` | Size uncertainty — "filters the collection by her size" |
| `pinch_zoom` | Fabric, on touch |
| `video_engagement` | Fit and shape |
| `collection_pdp_loop` | Comparison |
| `image_load_failure` | The fabric silence rule — cannot fire |
| `checkout_started`, `cart_remove` | The middle of the funnel |
| `known_size_history`, `prior_return_reason` | See gap 9 |

---

## 7. Nothing compares consecutive periods

`nudge_performance_insights` rows are per-period snapshots. Nothing diffs them.

**Blocks:** every trend arrow in the dashboard — and **falling demand is the product's
central claim.** "A friction point that disappears is the goal" cannot currently be
demonstrated.
**Fix:** compare each row against the preceding period window in the digest job.

---

## 8. No promotion record

Nothing records that an answer was promoted onto a product page.

**Blocks:** "Resolved" / "Fixed for good" — a friction point can never retire, so the
one metric that shows the product working is inert.
**Fix:** store a promotion record, then retire friction points whose demand falls after it.

---

## 9. `nightlyBatchFacts` is never populated

`DecisionContext.nightlyBatchFacts` is declared and read by
`rules/repeat-buyer-same-fit.ts`, and nothing ever writes it.

**Blocks:** the `repeat_buyer_same_fit` silence rule **always no-ops**. It appears in the
rule list, appears to be built, and has never once suppressed anything. Shoppers who
already bought this fit get nudged about size anyway.
**Fix:** populate it from the nightly job, which needs `known_size_history` and
`prior_return_reason` from gap 6.

---

## 10. Segment keys are hardcoded

```ts
buildSegmentKey({ deviceType, isReturning: false, cartValue: 0 })
```

Both call sites — `index.ts:139` and `decision/engine.ts:122`.

**Blocks:** segment performance is device-type only. Also narrows what the bandit can
learn, since every non-device segment collapses into one arm.
**Fix:** feed real returning-visitor and cart-value state in. Two lines plus the state.

---

## 11. Generated cards carry no evidence strength

No score for how much source material a card was built from.

**Blocks:** "Low confidence" — a card built from 4 reviews is indistinguishable from one
built from 240, so the dashboard cannot tell a merchant which answers are thin.
**Fix:** store a source-strength score alongside each generated card.

---

## Missing endpoints

Data exists, no route:

- A feed over `nudge_shown_log` — the Nudges page's live list
- A grouped count over `suppression_log` — the restraint breakdown
- A daily rollup for trends (gap 7)
- A session timeline
- A catalog-coverage query

---

## Suggested order

**Free or near-free**

1. `product_id` into the insight group-by — one line, unblocks revenue at risk
2. Real segment state — two lines
3. Emit `zero_result_filter` — the rule is already waiting for it

**Cheap, high visibility**

4. Fabric card type + `zoom` rule — the composition data is already synced
5. Size-delta copy for bracketing — detection is complete, only copy is missing
6. Period-over-period comparison — unblocks every trend in the dashboard

**Real work**

7. Session id as a cart attribute — the only route to per-nudge return data
8. Promotion record — makes "Resolved" real
9. Comparison card + shared-fields-only rule + comparability test
10. `nightlyBatchFacts` — fixes a suppression rule that currently only looks built
