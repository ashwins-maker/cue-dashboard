import { cx } from "@/lib/cx";

/**
 * A product, as it appears in every table on the dashboard.
 *
 * The thumbnail is generated from the title rather than fetched: the catalog
 * sync stores no image URL today, and a grey box would read as a photo that
 * failed to load. A tinted monogram reads as what it is — a stand-in — and is
 * stable per product, so the same jean looks the same on every screen.
 *
 * `title` is optional on purpose. Plenty of what Cue does is store-wide: a
 * message written once and served everywhere, a suppression rule that fires
 * on a cart page, a question asked across the whole catalog. Those rows get a
 * dash, which is a statement that no product applies rather than a gap where
 * one is missing.
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
  /** Shown under the name — a topic, a price, whatever the table needs. */
  detail,
  className,
}: {
  title?: string | null;
  detail?: string;
  className?: string;
}) {
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

  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cx(
          "grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-semibold",
          tintFor(title),
        )}
      >
        {monogram(title)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-secondary">
          {title}
        </span>
        {detail && (
          <span className="block truncate text-[11px] text-quaternary">
            {detail}
          </span>
        )}
      </span>
    </span>
  );
}
