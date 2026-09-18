# Cue — requirements vs. what the repo actually has

Audit of [`Manukris-kv/Cue`](https://github.com/Manukris-kv/Cue) (package name `byond-nudges`)
against two requirement sets:

1. `byond-intents-and-nudges.md` — six shopper intents, their signals, nudges and sources
2. The merchant-dashboard pitch — six things the dashboard is claimed to show

Audited 2026-09-18 against commit `ac99dce`. Every ✅/❌ below was checked against source,
migrations, or the emitted-event list — not against the repo's own docs.

> **Correction up front.** The `Built?` column in `byond-intents-and-nudges.md` describes
> the `Byond v2` prototype, not Cue. Against Cue it is wrong on four of six rows —
> bracketing and comparison are both marked "No" and both are built and wired, and the
> two scoring bugs it names (size firing a flip early, a dead field-name mismatch) exist
> only in `Byond v2`'s `scoring.ts`. Correct that column before anyone plans off it.

---

## Update — 2026-09-18, re-audited against `171d4e3`

One further commit, built directly off this repo's
[`cue-required-items.md`](./cue-required-items.md) — its migrations cite the
audit items by number.

| Item | What shipped |
|---|---|
| **D1–D4** — four dead signals | `0015_wire_dead_signals.sql`. `zoom → size_guide` (2+ zooms), `colour_variant_change → reassurance` (2+ changes), `scroll_reversal → size_guide` (3+ reversals), `multi_tab_same_product → reassurance`. All four were emitted and captured before this; none could fire a card |
| **C2** — signal provenance in the rollup | `0016` adds `nudge_performance_insights.triggering_signals TEXT[]`, the distinct set of signal types behind each insight row |
| **A2** — `checkout_started` | Emitted on the real checkout click, with `cartValue` and `itemCount` |
| **A3** — `cart_remove` | Emitted, with size-swap sources excluded |
| Evidence trail | `card_content` now returns `sourceChunkIds`, so a generated line traces back to the store content it was built from |

**Fabric fires now, but has no card of its own.** `zoom` is gated on 2+ zooms and
serves the generic `size_guide`. Same for colour, which serves `reassurance`.
The intent rows below that read "not built" for fabric are corrected: detection
and content both exist; only a dedicated card type is missing.

---

## Update — 2026-09-18, re-audited against `e1f02b2`

Two commits since the `ac99dce` baseline closed five of the twelve gaps below.
This section is the delta; the sections after it are the original audit with the
affected rows corrected.

### Landed

| Gap | What shipped | Effect |
|---|---|---|
| **Outcome events** | `add_to_cart` now emitted from the `byond:cart-updated` listener for genuinely new cart lines, with size-swap destinations excluded so a swap is not double-counted as a fresh add | Conversion, lift, the z-test and the bandit's reward signal all populate. The single biggest unblock |
| **Product dimension** | `product_id` on `nudge_shown_log` and `suppression_log` (migration `0011`, relaxed to `TEXT` in `0014` because the value is client-supplied) | Every product name in the dashboard is real |
| **Content gaps** | `no_content_available` added to `SuppressionReason` and logged by the decision engine when a rule matched but the content pipeline produced no variant | "Not covered" is a measured state, not an inference. Previously this case logged nothing at all |
| **Orders and returns** | `read_orders` scope, `ORDERS_CREATE` + `REFUNDS_CREATE` webhooks, `product_orders` + `product_returns` tables, `GET /dashboard/product-outcomes` | Real return rate — but see the scope caveat below |
| **Shopper questions** | `chat_questions` stores every question with its embedding, answered or not; greedy cosine clustering at 0.85 groups phrasings; `GET /dashboard/chat-question-clusters` | Real demand per question, not just failure volume |

Also landed: fit and fabric metafields (`fit_summary`, `model_note`,
`fabric_composition`, `care_instructions`) are now loaded into card generation
as pre-stated facts.

### Two caveats worth holding onto

**Return rate is per product, not per nudge.** Shopify's order webhooks carry no
`session_id`, so an order cannot be tied back to the session that saw the card.
The repo is explicit that per-nudge attribution is out of scope. Closing it needs
the session id injected as a cart attribute at add-to-cart and read back off the
order. Until then, "a fit nudge that sells but comes back has failed" remains
unmeasurable at the nudge level.

**Return reasons are always `unstated`.** Shopify's refund payload carries no
structured reason, so `too_small` / `too_large` never arrives on its own. The
intents doc's proposed validation — rank the confusions by what they actually
cost — still cannot be run.

---

## Legend

| Mark | Meaning |
|---|---|
| ✅ | Built and wired end to end |
| ⚠️ | Partially built — works, but with a named gap |
| ❌ | Not built |

---

## 1. The six intents

| # | Intent | Signals present | Signals missing | Rule wired? | Content source | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Size uncertainty** | `variant_change` (carries `changeCountInWindow`), `review_filter_applied`, `size_chart_unit_toggle`, `text_selection`, `dwell`, `accordion_open` | "Returns to a size already tried" — no repeat-size tracking. `filter_applied` (collection filtered by size) is **not emitted** | ✅ six rules → `size_guide`. Window tightened in `0010` | ✅ size chart, fit-tagged reviews, exchange reasons | ✅ **Built** |
| 2 | **Fit / shape** | `size_guide_open`, `size_guide_close`, `dwell`, `scroll_reversal` | `video_engagement` not emitted | ⚠️ `size_guide_close`→`reassurance`, `dwell`→`size_guide`. **`scroll_reversal` is emitted but routes nowhere** | ✅ metafields synced; model height / worn size depends on the merchant populating them | ⚠️ **Built, one dead signal** |
| 3 | **Material / fabric** | `zoom`, `text_selection`, `accordion_open` | `pinch_zoom` not emitted | ⚠️ four rules, `zoom` wired in `0015` on 2+ zooms. **No `fabric` card type, so it serves the generic size card** | ✅ composition + care synced; stretch/rigid reviews available | ⚠️ **Fires, generic copy** |
| 4 | **Return risk** | `policy_page_nav` (with the `returnedToProduct` boolean — the "and comes back" check, fixed in `0008`), `cart_dwell_before_checkout`, `checkout_back_to_pdp`, `atc_hover_no_click`, `atc_approach_count` | — | ✅ five rules → `shipping_info` / `reassurance` | ✅ returns policy parsed and fed into card generation | ✅ **Fully built** — best covered of the six |
| 5 | **Bracketing** | `multi_size_cart`, `quantity_increase_same_item`, `cart_size_swap` | — | ✅ all three → `size_guide` | ⚠️ routes to the **generic** size card. No size-delta copy ("the 30 is 1in wider at the waist") | ⚠️ **Detection built, copy missing** |
| 6 | **Comparison** | `product_comparison`, `multi_tab_compare`, `multi_tab_same_product`, `tab_switch_cadence` | `collection_pdp_loop` not emitted | ⚠️ two rules → `reassurance`. `multi_tab_same_product` routes nowhere. **A `/compare` endpoint exists**, plus in-chat side-by-side | ⚠️ no shared-fields-only rule, no comparability test, no dedicated comparison card type | ⚠️ **Tracking built, rules are the gap** |

### The intents doc's own "shared fields only" rule

Specified, not implemented. Required before comparison ships:

- Field present on both products → show the row
- Missing on either → drop the whole row
- No shared rows at all → say nothing

Nothing in `compare-route.ts` enforces this today, so a better-documented product wins by default.

---

## 2. Candidates that didn't make the list

| Candidate | Have | Need |
|---|---|---|
| **Stock / availability** | `out_of_stock_select` emitted + rule → `stock_urgency` card ✅ | `zero_result_filter` has a **seeded rule but no emitter** — dead code. Restock dates absent from the catalog |
| **Colour accuracy** | `colour_variant_change` emitted | ❌ No rule, no card type. Customer photos not synced |
| **Delivery timing** | `accordion_open` → `shipping_info`, policies synced | Nothing — already works. **This is the cheapest third slot** |

---

## 3. The dashboard pitch

| Claim | Data | API | Screen in our app | Need |
|---|---|---|---|---|
| What customers are doing | ✅ 58 signal types in `events` | ❌ | ❌ | Endpoint + session-timeline screen |
| Where they're hesitating | ✅ `suppression_log`, `nudge_shown_log`, hesitation signals | ⚠️ | ✅ Friction points | Grouping by topic/question — Cue groups by `card_type` only |
| What questions they're asking | ⚠️ `chat_escalations` | ✅ `/dashboard/chat-escalations` | ❌ | Answered questions aren't retained. Today this is only *"what you could not answer"* |
| Which nudges are working | ⚠️ tables + stats exist, **empty** | ✅ `/dashboard/nudge-performance` | ✅ Impact | **Outcome events** — see §5 |
| Where customers are dropping off | ❌ | ❌ | ❌ | Outcome events + funnel aggregation |
| Friction across the store | ✅ `friction_insights` — fully computed | ✅ `/dashboard/friction-report` | ❌ | **Nothing. Biggest ready-made win** |

---

## 4. Backend endpoints already live

Nine routes serving real data. Our app currently uses **none** of them.

| Endpoint | Returns | Our screen |
|---|---|---|
| `/dashboard/shop-lookup` | Shopify domain → internal shop UUID | — |
| `/dashboard/nudge-performance` | Lift vs. holdout per card type + variant, with `p_value` and significance flag | Impact |
| `/dashboard/friction-report` | Dead clicks, rage clicks, scroll hunting by selector + page, severity, sample sessions | ❌ none |
| `/dashboard/consent-summary` | Real consent-denied denominator | ❌ none (we hardcode 18%) |
| `/dashboard/rules` + `/toggle` + `/conditions` | Nudge and suppression rule config | Settings (currently mock) |
| `/dashboard/chat-escalations` + `/resolve` | Verbatim unanswered questions | ❌ none |
| `/dashboard/bandit-performance` | Per-variant win rates | ❌ none |
| `/dashboard/optimization-suggestions` | Plain-language recommendations, read-only | ❌ none |
| `/dashboard/segment-performance` | Breakdown by device / returning / cart value | ❌ none |
| `/dashboard/card-content` | Live card copy per product | ❌ none (we deleted this screen) |

---

## 5. Cross-cutting — the things that block everything else

| Concern | Status | Detail |
|---|---|---|
| **Outcome events** | ✅ **Closed** | `add_to_cart` is now emitted and flows through to `outcome.conversion.addedToCart`, lift and the bandit. `cart_remove` and `checkout_started` are still emitted by nothing, so the middle of the funnel stays empty |
| **Returns** | ⚠️ **Partly closed** | Real refund data now arrives via `REFUNDS_CREATE` into `product_returns`. Per product and aggregate only — not attributable to a nudge or a session, and the reason is always `unstated` |
| **Silence rules** | ⚠️ | Seven built — `assistive_tech_active` (short-circuits all others), `size_chart_read_thorough`, `repeat_buyer_same_fit`, `fast_confident_atc`, `prior_dismissal_same_type`, `back_in_stock_signup_suppression`, `already_added_to_cart`. But `repeat_buyer_same_fit` always no-ops: `DecisionContext.nightlyBatchFacts` is never populated |
| **"State the fact, never recommend"** | ⚠️ | A convention inside `card-generation-prompt.ts`, not a gate. Nothing rejects a generated card that recommends |
| **Always-open panel model** | ❌ | Cue renders one card at a time and explicitly refuses to stack. Switching to the panel is a rewrite of `floating-component.ts`, not a config flag |
| **Log everything from day one** | ⚠️ | 58 of ~83 spec'd signals emitted; roughly 48 captured but read by no rule |
| **Dashboard auth** | ❌ | `/dashboard/*` trusts a client-supplied `shopId` with no verification. Flagged in the repo as unsafe to onboard a second merchant |
| **Rate limiting** | ❌ | None anywhere, including an unauthenticated `/chat` that triggers per-token LLM calls |
| **Widget bundle** | ⚠️ | 14.63kb gzipped against a 15kb budget. ~0.37kb headroom |

---

## 6. What exists, by layer

| Layer | Built |
|---|---|
| **Signals** | 58 emitted event types across hesitation, self-stated intent, approach–avoid, visual inspection, re-reading, session/journey, cross-tab, bracketing, nudge lifecycle, post-nudge resolution, restraint |
| **Card types** | `size_guide`, `shipping_info`, `stock_urgency`, `reassurance`, `back_in_stock_prompt`. **No fabric, colour or comparison card** |
| **Decision** | In-memory rule eval, no network call at decision time. Rules cached per session, refreshed on interval |
| **Restraint** | Seven suppression rules, priority-ordered, first-to-fire wins. Pure function, separately testable. Every suppression logged with its reason |
| **Holdout** | Per-shop percentage, schema default 10, never 0 |
| **Bandit** | Thompson Sampling over `(shop, segment, card_type, variant)`, nightly retrain, Redis hot cache |
| **Content** | Offline generation only — no LLM in the shopper path. Live price/stock injected as `{placeholder}` at render |
| **Measurement** | Two-proportion z-test, `MIN_SAMPLE_SIZE_PER_GROUP = 30`, returns `null` rather than a misleading p-value below that |
| **Friction** | Dead-click clustering into rage clicks (3+ on one selector in 5s), scroll hunting, thresholds ≥5 sessions and ≥5% baseline |
| **Chat** | Groq + Gemini behind a swappable provider, side-by-side comparison, follow-up chips, escalation to a merchant queue |
| **Privacy** | Consent gate at SDK and ingestion. No shopper profile table. Per-shop Qdrant collection so uninstall is one delete. A dedicated privacy-boundary test suite |
| **Jobs** | Product sync, content generation, nightly bandit retrain, nightly reconciliation, weekly insight digest, data retention purge |

---

## 7. Build order

### Free — real data, live endpoint, no backend work

1. **Site friction screen** — the only place the product answers *"why customers are not buying"* rather than *"what they asked"*. Data is computed, thresholded and served today
2. **Shopper questions screen** — verbatim, and the most quotable thing in a demo

### One SDK change, four screens unblocked

3. **Emit outcome events.** Unblocks Impact, drop-off, bandit weighting and optimization suggestions at once

### New work, cheapest first

4. **Fabric card type + a `zoom` rule** — the cheapest missing intent
5. **Size-delta copy for bracketing** — detection is done, copy is not
6. **Comparison: shared-fields rule + comparability test** — most expensive, exactly as the intents doc predicts

### Decide, do not build

7. **Returns.** Either scope the nightly Shopify join, or remove return rate from the UI. It currently reads as measured and is not
8. **Pill or panel.** Everything above assumes Cue's one-card-at-a-time model. The panel is a rewrite, not a toggle
9. **Third intent slot.** The doc says let the pilot store's returns data choose. **Delivery is already built** and is the cheapest answer if that data never arrives

---

## 8. Open questions this audit could not settle

- Does the pilot store's returns data actually rank size first? Nothing here has been validated against outcomes — the intents doc says so itself, and the outcome-event gap means it cannot be, yet
- Is `Byond v2` a design exploration to fold back into Cue's dashboard, or a separate build? Cue has the backend that `Byond v2`'s screens are mocking
- The vocabulary work in `Byond v2` — friction points, content gaps, signal source, revenue at risk — has no equivalent in Cue, which organises by system component (`card_type`, bandit arm, rule). Those are different products on the same data
