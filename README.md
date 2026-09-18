# Cue — merchant dashboard

The merchant-facing side of Cue: a Shopify app that answers a shopper's question
at the moment they hesitate, using content the store already has.

This repo is the **dashboard only**. The storefront widget, decision engine and
backend live in [`Manukris-kv/Cue`](https://github.com/Manukris-kv/Cue).

---

## What it shows

| Screen | Answers |
|---|---|
| **Overview** | What Cue settled, who it could not help, and how often it stayed quiet |
| **Friction points** | What shoppers get stuck on, ranked by revenue at risk, and what your pages cannot answer |
| **Nudges** | The six things Cue watches for, what it says, and whether answering settles it |
| **Settings** | Store connection, which topics Cue may talk about, privacy, and the off switch |

Two ideas run through all of it:

- **Falling demand is the goal.** A question that disappears has been answered on
  the page, and the widget no longer needs to say it.
- **Restraint is the product.** Every moment Cue could have spoken and chose not
  to is recorded and reported, because silence is the default.

---

## Honest about its own data

Every figure carries its provenance. Two markers, deliberately different colours:

- A grey **ⓘ** means the number is real but modelled, lagging, or correlational —
  it explains how it is produced and what it cannot prove.
- A red **dot** means the number is a placeholder, and names the exact backend
  change that would connect it.

[`src/lib/wiring.ts`](src/lib/wiring.ts) is the single source for both, audited
field by field against the Cue backend's schema, insight queries, and every
`emit()` call site. Call sites mark fields unconditionally, so a red dot
disappears on its own as the backend catches up — no UI edit needed.

---

## Running it

Node 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build      # production build
npx tsc --noEmit   # typecheck
npx eslint src     # lint
```

---

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript ·
lucide-react. Dark only, built on Untitled UI's token structure with a neutral
near-black surface ramp.

All data is currently placeholder, shaped field-for-field to the Cue backend so
each screen swaps to live queries without a rewrite.

---

## Documents

| File | |
|---|---|
| [`docs/cue-requirements-status.md`](docs/cue-requirements-status.md) | What the Cue repo has against the product requirements |
| [`docs/cue-required-items.md`](docs/cue-required-items.md) | The 30 items still needed, grouped and prioritised |
| [`byond-intents-and-nudges.md`](byond-intents-and-nudges.md) | The six shopper intents, their signals, and what each is worth |
