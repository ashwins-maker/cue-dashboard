"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { PRODUCT_CATALOG, shortProductId } from "@/lib/merchant-data";

/**
 * A product, as it appears in every table on the dashboard.
 *
 * Callers pass a title, which is all most of them hold — a table renders a
 * friction point or a firing, not a catalog row. The image and the id are
 * looked up here so the same jean looks identical on every screen without
 * every call site carrying the catalog around.
 *
 * Three states, on purpose:
 *
 *   no title      — a dash. Plenty of what Cue does is store-wide: a message
 *                   written once and served everywhere, a rule that fires on a
 *                   cart page. A dash says no product applies, rather than
 *                   leaving a gap that reads as missing data.
 *   not in catalog — the name and a tinted monogram, no id. Honest for a
 *                   product the sync has not reached.
 *   in catalog    — photo, name, and the id beneath it.
 *
 * The image falls back to the monogram if it fails to load. A broken-image
 * icon in a table reads as a bug; a monogram reads as a product without a
 * photo, which is what it is.
 */

const TINTS = [
  "bg-[var(--utility-brand-50)] text-[var(--utility-brand-700)]",
  "bg-[var(--utility-success-50)] text-[var(--utility-success-700)]",
  "bg-[var(--utility-warning-50)] text-[var(--utility-warning-700)]",
  "bg-[var(--utility-gray-50)] text-[var(--utility-gray-700)]",
];

function tintFor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

/** First letter of each of the first two words — "Mid-Rise Straight Jean" → MS. */
function monogram(title: string): string {
  return title
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProductCell({
  title,
  /** Overrides the catalog lookup, for rows that carry their own id. */
  productId,
  /** Replaces the id line — a topic, a price, whatever the table needs. */
  detail,
  className,
}: {
  title?: string | null;
  productId?: string;
  detail?: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!title) {
    return (
      <span
        className={cx("text-[13px] text-quaternary", className)}
        title="Not tied to a single product"
      >
        —
      </span>
    );
  }

  const entry = PRODUCT_CATALOG[title];
  const gid = productId ?? entry?.id;
  const showImage = entry?.image && !imageFailed;

  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.image}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="size-7 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span
          aria-hidden
          className={cx(
            "grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-semibold",
            tintFor(title),
          )}
        >
          {monogram(title)}
        </span>
      )}

      <span className="min-w-0">
        <span className="block truncate text-[13px] text-secondary">
          {title}
        </span>
        {detail ? (
          <span className="block truncate text-[11px] text-quaternary">
            {detail}
          </span>
        ) : (
          gid && (
            <span
              title={gid}
              className="block truncate font-mono text-[11px] text-quaternary"
            >
              {shortProductId(gid)}
            </span>
          )
        )}
      </span>
    </span>
  );
}
