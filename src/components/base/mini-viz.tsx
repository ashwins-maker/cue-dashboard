import { cx } from "@/lib/cx";

/**
 * Small inline visuals for metric cards.
 *
 * Deliberately not sparklines: there is no time series anywhere in the data,
 * and a sparkline drawn from a single period would be an invented trend.
 * These show composition, which is what the numbers actually carry.
 */

export interface MiniBarSegment {
  value: number;
  /** A background utility, e.g. "bg-success-500". */
  className: string;
  label: string;
}

export function MiniBar({
  segments,
  className,
}: {
  segments: MiniBarSegment[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div
      role="img"
      aria-label={segments
        .map((s) => `${s.label}: ${s.value.toLocaleString("en-US")}`)
        .join(", ")}
      className={cx(
        "flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--chart-track)]",
        className,
      )}
    >
      {segments.map((segment) => (
        <div
          key={segment.label}
          className={segment.className}
          style={{ width: `${(segment.value / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

/**
 * "4 of 10" as ten dots. At these counts a dot grid is read faster than a
 * percentage, and it cannot imply precision the number does not have.
 */
export function DotGrid({
  total,
  filled,
  label,
  filledClassName = "bg-[var(--chart-negative)]",
}: {
  total: number;
  filled: number;
  label: string;
  filledClassName?: string;
}) {
  return (
    <div role="img" aria-label={label} className="flex flex-wrap gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cx(
            "size-1.5 rounded-full",
            index < filled ? filledClassName : "bg-[var(--chart-track)]",
          )}
        />
      ))}
    </div>
  );
}
