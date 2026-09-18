import { Card, CardHeader } from "@/components/base/card";
import { InfoTip } from "@/components/base/info-tip";
import { formatCount, formatShare, type FunnelStep } from "@/lib/overview-data";

/**
 * The nudge funnel drawn as an actual funnel.
 *
 * The shape carries the thing a stack of bars does not: the slope between two
 * stages IS the drop-off, so the eye reads where shoppers are lost before it
 * reads any number.
 *
 * The SVG holds geometry only — no text — at a fixed size, so nothing scales
 * and nothing blurs. Labels live in the HTML column beside it, which also
 * keeps them selectable and screen-reader friendly.
 */

const W = 168;
const BAND_H = 46;
const GAP = 20;
const PAD_Y = 6;

const BAND_FILL = "var(--chart-accent)";
const BAND_OPACITY = [1, 0.78, 0.56];

export function NudgeFunnel({
  steps,
  dismissed,
  resolved,
  resolvedShare,
}: {
  steps: FunnelStep[];
  dismissed: number;
  resolved: number;
  resolvedShare: number;
}) {
  const height = PAD_Y * 2 + steps.length * BAND_H + (steps.length - 1) * GAP;
  const centre = W / 2;
  const widthOf = (share: number) => Math.max(18, share * (W - 8));
  const topOf = (index: number) => PAD_Y + index * (BAND_H + GAP);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="What happened to the cards"
        description="Every card Cue showed, and how far each one got."
      />

      <div className="flex flex-1 flex-wrap items-start gap-x-6 gap-y-4 px-5 py-5">
        <svg
          width={W}
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          role="img"
          aria-label={steps
            .map(
              (s) =>
                `${s.label}: ${formatCount(s.value)}, ${formatShare(s.share)}`,
            )
            .join(". ")}
          className="shrink-0"
        >
          {steps.slice(0, -1).map((step, index) => {
            const next = steps[index + 1];
            const w1 = widthOf(step.share) / 2;
            const w2 = widthOf(next.share) / 2;
            const y1 = topOf(index) + BAND_H;
            const y2 = topOf(index + 1);
            return (
              <polygon
                key={`link-${step.key}`}
                points={`${centre - w1},${y1} ${centre + w1},${y1} ${centre + w2},${y2} ${centre - w2},${y2}`}
                fill={BAND_FILL}
                opacity={0.18}
              />
            );
          })}

          {steps.map((step, index) => {
            const w = widthOf(step.share);
            return (
              <rect
                key={step.key}
                x={centre - w / 2}
                y={topOf(index)}
                width={w}
                height={BAND_H}
                rx={4}
                fill={BAND_FILL}
                opacity={BAND_OPACITY[index % BAND_OPACITY.length]}
              />
            );
          })}
        </svg>

        <ol className="min-w-[180px] flex-1">
          {steps.map((step, index) => {
            const previous = index > 0 ? steps[index - 1] : null;
            const lost = previous ? previous.value - step.value : 0;

            return (
              <li
                key={step.key}
                style={{ height: BAND_H + (index > 0 ? GAP : 0) }}
                className="flex flex-col justify-center"
              >
                {previous && (
                  <p className="text-[11px] text-quaternary tabular-nums">
                    ↓ {formatCount(lost)} dropped off
                  </p>
                )}
                <p className="mt-0.5 text-[13px] text-secondary">
                  {step.label}
                </p>
                <p className="text-[15px] leading-tight font-semibold text-primary tabular-nums">
                  {formatCount(step.value)}
                  <span className="ml-2 text-[12px] font-normal text-tertiary">
                    {formatShare(step.share)}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <footer className="grid grid-cols-2 gap-px border-t border-secondary bg-[var(--border-secondary)]">
        <div className="bg-secondary px-5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] text-tertiary">
            Settled afterwards
            <InfoTip label="Counted from what happened next">
              The shopper stopped flipping sizes, stopped reopening the size
              chart, or stopped hunting the policy page. Counted whether or not
              they touched the card, which is why it can exceed the read figure.
            </InfoTip>
          </p>
          <p className="mt-1 text-[17px] leading-none font-semibold text-primary tabular-nums">
            {formatCount(resolved)}
            <span className="ml-2 text-[12px] font-normal text-tertiary">
              {formatShare(resolvedShare)}
            </span>
          </p>
        </div>
        <div className="bg-secondary px-5 py-3">
          <p className="text-[11px] text-tertiary">Closed by the shopper</p>
          <p className="mt-1 text-[17px] leading-none font-semibold text-primary tabular-nums">
            {formatCount(dismissed)}
          </p>
        </div>
      </footer>
    </Card>
  );
}
