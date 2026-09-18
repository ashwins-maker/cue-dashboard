# Byond — Intents & Nudges

Draft · 2026-09-18 · denim pilot

Six shopper intents, the signals that detect them, the nudge that answers them, and
what each one is worth. Ranked by detection precision × whether the store can answer
× what it costs the merchant when unanswered.

**One rule across all six: state the fact, never recommend.** No nudge tells her what
to choose. Actions are navigational only — open the size chart, see the measurements,
show the side by side. Nothing that makes the choice for her.

---

## The table

| Intent | Strong signals | Stay quiet when | Nudge | Wins when | Built? |
|---|---|---|---|---|---|
| **1. Size uncertainty**<br>*"Which size am I in this brand?"* | 3+ size switches in 20s, no add-to-cart · returns to a size already tried · filters collection by size · filters reviews to her size | Added to cart · bought this fit before · read the size chart fully | "38 of 47 reviewers said this runs small in the waist." **[Open size chart]**<br>*from fit-tagged reviews, exchange reasons, size chart* | Picks a size, no exchange later | Yes — fires 1 flip too early, blind to repeat visits |
| **2. Fit / shape**<br>*"Will this shape work on my body?"* | Opens size guide → closes → picks nothing · 5s+ on fit description · scrolls back to re-read fit · replays product video | Bought this fit before · screen reader active | "Rise 11in, inseam 30in, leg opening 14in. Model is 173cm in a 28." **[See measurements]**<br>*from metafields, model height and worn size* | Stops hunting, commits | Yes — one rule likely dead (field name mismatch) |
| **3. Material / fabric**<br>*"How will it behave when worn?"* | Zooms fabric 2+ times or pinch-zooms · 5s+ on composition · selects composition text · opens care section | Photos failed to load | "98% cotton, 2% elastane. 12 of 14 reviewers mentioned stretch."<br>*from composition, care, stretch/rigid reviews* | Stops zooming | Yes — both halves score under threshold alone |
| **4. Return risk**<br>*"What if I'm wrong?"* | Leaves to returns page **and comes back** · 30s+ in cart before checkout · leaves checkout back to product · hovers buy, backs off twice | Fast confident add-to-cart | "Free exchanges within 30 days, tags attached."<br>*from the returns policy page* | Checks out, doesn't re-check policy | Yes — fires on one visit, doesn't check she returned |
| **5. Bracketing**<br>*"I'll buy both and send one back"* | Two sizes of one item in cart · raises quantity on one size · swaps size inside cart | Clearly separate products | "The 30 is 1in wider at the waist. Same inseam."<br>*from size chart deltas, reviews by size band* | She removes one — weaker without a directive, returns data is the only proof | No — zero cart signals exist |
| **6. Comparison**<br>*"Which of these two is right?"* | Bounces between two products 3+ times · two products open in two tabs, switching · same product in two tabs at different sizes · loops between collection grid and product page | Added to cart · only one product viewed · products aren't comparable | "Rise 11in vs 12.5in. Leg opening 14in vs 22in." **[Show side by side]**<br>*from both products' measurement metafields, shared fields only* | She decides either way, rather than leaving undecided | No — no cross-product or cross-tab tracking |

---

## Honest assessment

| Intent | Detection precision | Store can answer? | Cost when unanswered | Verdict |
|---|---|---|---|---|
| Size | High — flipping is unambiguous | Always | High — top exchange reason | **Keep. Strongest case.** |
| Bracketing | Very high — no inference needed | Always | Very high — a guaranteed return | **Keep. Detection is the best on the list; effect is weaker without a directive.** |
| Fit | Medium — dwell and re-reads are noisy | Usually, if measurements exist | High | **Keep, detection needs work.** |
| Fabric | Medium-low — zoom is weak evidence | Yes | Medium | **Keep, lowest confidence of the six.** |
| Return risk | Medium — one policy visit means little | Always | Medium | **Recast as a modifier, not an intent.** |
| Comparison | Low today — required tracking doesn't exist | Only if both products have the same fields | Medium-high | **Keep, but it's the most expensive to build.** |

### Comparison — show only, never choose

The one-pager parks product redirection as an open question:

> Conversational tools can steer a shopper to a different product mid-session. Byond
> cannot do that inline without breaking "one nudge at a time." We need to decide
> whether product redirection is a v2 nudge type or a permanent boundary.

We stay inside the boundary by never picking. Both products' figures side by side, no
recommendation, no CTA to either one. She chooses. That removes the inventing problem
(we only lay out what both pages already state), the merchant conflict (we never moved
a sale) and the measurement problem — success becomes *did she decide at all*, not *did
she buy the one we pointed at*.

**Missing data is a silent recommendation.** If one product shows rise, inseam and leg
opening while the other shows three blanks, the layout has recommended the first. Blank
cells favour the better-documented product, which usually means the older or bigger one.

The rule that fixes it:

- Field present on both → show the row
- Missing on either → drop the whole row
- No shared rows at all → say nothing

No blanks, no implied winner, and every dropped row becomes a merchant gap report:
*"412 shoppers compared these two. We could only show 2 of 6 measurements because the
wide leg has no rise or inseam."*

**Attribute order is still editorial.** Price first and the cheaper one wins; review
count first and the popular one wins. Keep it fixed and boring — measurements, fabric,
care. Never price, never review counts, never anything ranked.

**The cost is unchanged by not choosing.** Cross-product memory, cross-tab memory and a
comparability test (jeans vs jeans yes, jeans vs belt no). Every other intent works
inside one page view.

The cheap version that works today is the same product at two sizes — "29 and 30 differ
by 1in at the waist, same inseam." One size chart, no cross-product tracking, no
comparability test, no missing-data problem.

---

## Known weaknesses in this list

**It's denim-shaped.** Four of six came from a denim pilot taxonomy. Size, fit and fabric
are apparel problems. Furniture asks about dimensions and delivery; electronics about
compatibility; beauty about shade. If the pilot is denim, this list is right. If the
product is "Shopify," it's one vertical dressed as a general theory.

**Nothing here has been validated against data.** Every entry was chosen by reasoning.
The test exists and hasn't been run: pull the pilot store's last 90 days of returns and
exchanges with stated reasons, and rank the confusions by what they actually cost. If
"too small" dominates, size earns its top slot. If it's "not as pictured," colour
accuracy belongs on this list and fabric probably doesn't.

**Return risk is likely a symptom.** Checking returns after twenty seconds of
size-flipping is fear of getting the size wrong, not a policy question. Answering with
the policy answers the surface.

**Fabric may be telling us something.** Both its scoring rules fall below the firing
threshold on their own, so it almost never fires. That may be the system quietly
reporting that the evidence is thin.

---

## Candidates that didn't make the list

| Candidate | Case for | Case against |
|---|---|---|
| **Stock / availability** | Cleanest signal available — she clicked a sold-out size. Store always knows. Zero-result filters are pure lost demand. | The answer is often "no," and restock dates are frequently unknown |
| **Colour accuracy** | Named as the top non-size return reason across apparel. Customer photos answer it perfectly. | Hard to detect — cycling colours could just be browsing |
| **Delivery timing** | Very clean signal (opens shipping accordion). Always answerable. Kills sales silently near gifting dates. | Boring — but boring and correct beats clever and wrong |

**Strongest swap available today:** drop return risk to a modifier, promote stock /
availability.

---

## Two structural notes

**Every intent needs a matching silence rule.** She read the size chart properly → say
nothing about size. She bought this fit before → say nothing. She dismissed this topic
last visit → say nothing. Without these, all six will interrupt people who already had
their answer. The analytics spec lists these under "reasons not to nudge"; none are
built yet.

**If the always-open panel model wins**, nothing above changes except the verb. These
stop being six *nudges* and become six *reasons the panel reorders* — the top slot goes
to whichever is scoring highest. Same signals, same sources, same copy.

**Not recommending pushes toward the panel.** Without a resolution to deliver, there is
less reason to interrupt — the widget becomes a well-timed information surface rather
than an intervention. The pill's form (appears, says one thing, recedes) is built around
delivering a recommendation we have now ruled out.

---

## Recommended next step

Ship three, not six. Size and bracketing are near-certain. The third slot should be
decided by the pilot store's returns data, not by us.

Log **all** candidate signals from day one, including ones we don't act on — the
analytics spec names about ninety. Detection can be added later; data that was never
collected can't be recovered.
