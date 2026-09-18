// Placeholder denim catalog for the demo store. Synthetic but shaped exactly like the
// real store-owned sources Cue is allowed to draw from (F-2.1): catalog, metafields,
// reviews, exchange history, parsed policy. Swap for a real store's data via the same
// shape once the pilot store is connected — nothing downstream should need to change.

export interface ReviewFitTag {
  id: string;
  rating: number;
  text: string;
  fitTag: "runs_small" | "true_to_size" | "runs_large" | null;
  stretchRigid: "stretch" | "rigid" | null;
  verifiedSize?: string;
}

export interface DenimProduct {
  id: string;
  handle: string;
  title: string;
  price: number;
  currency: string;
  variants: { id: string; size: string; inventory: number }[];
  fitNote: string; // one-sentence, store-owned, used verbatim in nudges
  composition: string;
  care: string;
  modelInfo: { heightCm: number; wornSize: string };
  riseLegMeasurements: string;
  reviews: ReviewFitTag[];
  exchangeReasons: Record<string, number>; // reason -> count, last 90 days
}

export const RETURNS_POLICY = {
  windowDays: 30,
  freeExchanges: true,
  summaryText: "Free exchanges within 30 days. Original tags must be attached.",
  parsedAt: "2026-09-01T00:00:00.000Z",
  merchantConfirmed: true,
};

export const DEMO_PRODUCTS: DenimProduct[] = [
  {
    id: "gid://shopify/Product/1001",
    handle: "mid-rise-straight-jean",
    title: "Mid-Rise Straight Jean",
    price: 78,
    currency: "USD",
    variants: [
      { id: "v-27", size: "27", inventory: 4 },
      { id: "v-28", size: "28", inventory: 6 },
      { id: "v-29", size: "29", inventory: 9 },
      { id: "v-30", size: "30", inventory: 5 },
    ],
    fitNote: "Sits at the natural waist with a straight leg. Runs small — most reviewers size up one.",
    composition: "98% cotton, 2% elastane",
    care: "Machine wash cold, inside out. Tumble dry low.",
    modelInfo: { heightCm: 173, wornSize: "28" },
    riseLegMeasurements: "Rise 11in, inseam 30in, leg opening 14in",
    reviews: [
      { id: "r1", rating: 5, text: "Sized up and it's perfect. Would've been too snug true to size.", fitTag: "runs_small", stretchRigid: "stretch", verifiedSize: "29" },
      { id: "r2", rating: 4, text: "Holds its shape all day, a little stretch but not baggy by evening.", fitTag: "true_to_size", stretchRigid: "stretch" },
      { id: "r3", rating: 3, text: "Waist ran tight, exchanged for a size up.", fitTag: "runs_small", stretchRigid: null },
      { id: "r4", rating: 5, text: "Fabric is sturdy, doesn't stretch out by end of day like my old pair.", fitTag: null, stretchRigid: "rigid" },
    ],
    exchangeReasons: { too_small: 14, too_big: 3, fabric: 1 },
  },
  {
    id: "gid://shopify/Product/1002",
    handle: "high-rise-wide-leg-jean",
    title: "High-Rise Wide Leg Jean",
    price: 88,
    currency: "USD",
    variants: [
      { id: "v-25", size: "25", inventory: 2 },
      { id: "v-26", size: "26", inventory: 7 },
      { id: "v-27", size: "27", inventory: 8 },
      { id: "v-28", size: "28", inventory: 3 },
    ],
    fitNote: "High-rise with a relaxed wide leg. True to size through the waist and hip.",
    composition: "100% organic cotton, rigid denim",
    care: "Machine wash cold. Hang dry to preserve shape.",
    modelInfo: { heightCm: 168, wornSize: "26" },
    riseLegMeasurements: "Rise 12.5in, inseam 32in, leg opening 22in",
    reviews: [
      { id: "r5", rating: 5, text: "True to size, no stretch so it holds the wide-leg shape perfectly.", fitTag: "true_to_size", stretchRigid: "rigid" },
      { id: "r6", rating: 4, text: "Rigid denim, softens up after a few washes.", fitTag: "true_to_size", stretchRigid: "rigid" },
      { id: "r7", rating: 2, text: "No give at all in the waist, sized up and it worked.", fitTag: "runs_small", stretchRigid: "rigid" },
    ],
    exchangeReasons: { too_small: 6, too_big: 5, fabric: 4 },
  },
  {
    id: "gid://shopify/Product/1003",
    handle: "skinny-stretch-jean",
    title: "Skinny Stretch Jean",
    price: 68,
    currency: "USD",
    variants: [
      { id: "v-26", size: "26", inventory: 5 },
      { id: "v-27", size: "27", inventory: 6 },
      { id: "v-28", size: "28", inventory: 0 },
      { id: "v-29", size: "29", inventory: 4 },
    ],
    fitNote: "Slim through the hip and leg with four-way stretch. Runs large — most reviewers size down.",
    composition: "92% cotton, 6% polyester, 2% elastane",
    care: "Machine wash cold. Do not bleach.",
    modelInfo: { heightCm: 165, wornSize: "27" },
    riseLegMeasurements: "Rise 9.5in, inseam 29in, leg opening 10.5in",
    reviews: [
      { id: "r8", rating: 5, text: "Sized down and it fit like a glove. True to size felt loose by afternoon.", fitTag: "runs_large", stretchRigid: "stretch" },
      { id: "r9", rating: 4, text: "Very stretchy, stays put all day.", fitTag: "runs_large", stretchRigid: "stretch" },
      { id: "r10", rating: 3, text: "Loosened up more than expected after wearing a few hours.", fitTag: "runs_large", stretchRigid: "stretch" },
    ],
    exchangeReasons: { too_big: 11, too_small: 2 },
  },
];

export function findProduct(productId: string): DenimProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === productId);
}
