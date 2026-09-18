import { Card, CardHeader } from "@/components/base/card";
import type { SuppressionReason } from "@/lib/nudge-data";
import { formatCount, formatShare } from "@/lib/overview-data";

/**
 * Why Cue stayed quiet, as a donut.
 *
 * Parts of a whole, seven of them, ordered by size — the one shape a donut is
 * genuinely the right answer for. The total sits in the hole, which is the
 * number a merchant is actually looking for.
 *
 * A single-hue sequential ramp, not seven categorical colours: the reasons are
 * ordered by size, not by kind, so varying hue would imply a distinction that
 * is not there.
 */

const RAMP = [
  "var(--chart-seq-1)",
  "var(--chart-seq-2)",
  "var(--chart-seq-3)",
  "var(--chart-seq-4)",
  "var(--chart-seq-5)",
  "var(--chart-seq-6)",
  "var(--chart-seq-7)",
];

const SIZE = 172;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A hairline of card background between slices, so they read as separate. */
const SLICE_GAP = 2;

export function SuppressionBreakdown({
  reasons,
  total,
  quietShare,
}: {
  reasons: SuppressionReason[];
  total: number;
  quietShare: number;
}) {
  const sorted = [...reasons].sort((a, b) => b.count - a.count);

  // Cumulative offsets without mutating across the map: the lint rule against
  // reassignment after render is right that a running counter in a render body
  // is a trap, and the slice count here makes the cost irrelevant.
  const lengths = sorted.map((r) => (r.count / total) * CIRCUMFERENCE);
  const slices = sorted.map((reason, index) => ({
    reason,
    colour: RAMP[index % RAMP.length],
    length: Math.max(0, lengths[index] - SLICE_GAP),
    offset: lengths.slice(0, index).reduce((sum, l) => sum + l, 0),
  }));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="When Cue stayed quiet"
        description={`Held back ${formatShare(quietShare)} of the moments it could have spoken. Silence is the default.`}
      />

      <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-5 px-5 py-5">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`${formatCount(total)} cards held back. ${sorted
              .map((r) => `${r.label}: ${formatCount(r.count)}`)
              .join(". ")}`}
            // Start the first slice at twelve o'clock and run clockwise.
            style={{ transform: "rotate(-90deg)" }}
          >
            {slices.map((slice) => (
              <circle
                key={slice.reason.rule}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.colour}
                strokeWidth={STROKE}
                strokeDasharray={`${slice.length} ${CIRCUMFERENCE - slice.length}`}
                strokeDashoffset={-slice.offset}
              />
            ))}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] leading-none font-semibold text-primary tabular-nums">
              {formatCount(total)}
            </span>
            <span className="mt-1 text-[11px] text-tertiary">held back</span>
          </div>
        </div>

        <ul className="min-w-[200px] flex-1 space-y-2">
          {slices.map((slice) => (
            <li
              key={slice.reason.rule}
              className="flex items-center gap-2.5"
              title={slice.reason.explanation}
            >
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.colour }}
              />
              <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">
                {slice.reason.label}
              </span>
              <span className="text-[12px] text-tertiary tabular-nums">
                {formatShare(slice.reason.count / total)}
              </span>
              <span className="w-12 text-right text-[12px] text-primary tabular-nums">
                {formatCount(slice.reason.count)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-auto border-t border-secondary px-5 py-3">
        <p className="text-[11px] text-tertiary">
          A card appears only when a rule fires and no silence rule vetoes it.
        </p>
      </footer>
    </Card>
  );
}
