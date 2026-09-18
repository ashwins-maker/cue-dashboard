import { Card, CardHeader } from "@/components/base/card";
import { ARMS, formatShare, journey } from "@/lib/overview-data";

/**
 * The nudged sessions drawn as an actual funnel, left to right.
 *
 * A stack of bars gives each step a length to compare; a funnel gives the
 * space *between* two steps a shape, so the drop-off is read before any
 * number is. The taper is the point — nine in ten shoppers are gone by the
 * time an order lands, and a bar chart states that where a funnel shows it.
 *
 * The last two stages carry their holdout counterpart, because those are the
 * only two stages where a difference against the held-back group exists to
 * quote. Impression and engagement have no holdout equivalent: the held-back
 * group was, by definition, shown nothing.
 */

const W = 620;
const H = 132;
const LIFT: Record<string, number> = {
  "Added to cart after": ARMS.addedToCartNudged / ARMS.addedToCartHoldout - 1,
  "Placed an order": ARMS.convertedNudged / ARMS.convertedHoldout - 1,
};

export function NudgeToOrder() {
  const steps = journey();
  const band = W / steps.length;

  // Each stage is a trapezoid: its own share on the left edge, the next
  // stage's on the right, so neighbouring stages meet without a step.
  const half = (share: number) => Math.max((share * H) / 2, 1.5);

  return (
    <Card>
      <CardHeader
        title="From nudge to order"
        description="Nudged sessions only. Every step is a counted event."
      />

      <div className="px-5 pt-5 pb-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[132px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={steps
            .map((s) => `${s.label}: ${s.value.toLocaleString()}`)
            .join(". ")}
        >
          {steps.map((step, i) => {
            const next = steps[i + 1] ?? step;
            const x = i * band;
            const l = half(step.share);
            const r = half(next.share);
            const mid = H / 2;

            return (
              <polygon
                key={step.label}
                points={`${x},${mid - l} ${x + band},${mid - r} ${x + band},${mid + r} ${x},${mid + l}`}
                fill="var(--chart-accent)"
                opacity={1 - i * 0.2}
              />
            );
          })}

          {steps.slice(1).map((step, i) => (
            <line
              key={step.label}
              x1={(i + 1) * band}
              x2={(i + 1) * band}
              y1={0}
              y2={H}
              stroke="var(--bg-secondary)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
        >
          {steps.map((step, i) => {
            const lift = LIFT[step.label];
            return (
              <div key={step.label} className="min-w-0 pt-3">
                <p className="truncate text-[11px] text-tertiary">
                  {step.label}
                </p>
                <p className="mt-1 text-[15px] leading-none font-semibold text-primary tabular-nums">
                  {step.value.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-quaternary tabular-nums">
                  {i === 0 ? "of nudged sessions" : formatShare(step.share)}
                </p>
                {lift !== undefined && (
                  <p className="mt-1 text-[11px] font-medium text-success-primary tabular-nums">
                    +{formatShare(lift)} vs holdout
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
