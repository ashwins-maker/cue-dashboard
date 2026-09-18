import { Card, CardHeader } from "@/components/base/card";
import { formatShare, WEEKLY, WEEKLY_NOTE } from "@/lib/overview-data";

/**
 * Conversion in each arm, week by week.
 *
 * Plotted as two lines rather than one lift figure because a single number
 * cannot show when the gap opened. The annotation underneath names the change
 * that opened it, so the chart is not left to imply a cause on its own.
 */
export function WeeklyConversion() {
  const values = WEEKLY.flatMap((w) => [w.nudged, w.holdout]);
  const max = Math.max(...values) * 1.15;
  const min = Math.min(...values) * 0.85;

  const W = 560;
  const H = 180;
  const x = (i: number) => (i / (WEEKLY.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const path = (key: "nudged" | "holdout") =>
    WEEKLY.map((w, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(w[key])}`).join(
      " ",
    );

  const gridlines = [
    min + (max - min) * 0.2,
    (min + max) / 2,
    max - (max - min) * 0.2,
  ];

  return (
    <Card>
      <CardHeader
        title="Conversion, week by week"
        actions={
          <div className="flex items-center gap-4 text-[11px]">
            <Legend className="bg-brand-solid" label="Saw a nudge" />
            <Legend className="bg-quaternary" label="Held back" />
          </div>
        }
      />
      <div className="px-5 py-5">
        <div className="flex gap-3">
          <div
            className="flex flex-col justify-between py-1 text-[10px] text-quaternary tabular-nums"
            aria-hidden
          >
            {[...gridlines].reverse().map((v) => (
              <span key={v}>{formatShare(v)}</span>
            ))}
          </div>

          <svg
            viewBox={`0 -6 ${W} ${H + 12}`}
            className="h-[180px] w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Conversion rose from ${formatShare(WEEKLY[0].nudged)} to ${formatShare(WEEKLY[WEEKLY.length - 1].nudged)} for shoppers who saw a nudge, against ${formatShare(WEEKLY[WEEKLY.length - 1].holdout)} for the group held back.`}
          >
            {gridlines.map((v) => (
              <line
                key={v}
                x1={0}
                x2={W}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border-secondary)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path
              d={path("holdout")}
              fill="none"
              stroke="var(--chart-track)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
            <path
              d={path("nudged")}
              fill="none"
              stroke="var(--chart-accent)"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />

            <circle
              cx={x(WEEKLY.length - 1)}
              cy={y(WEEKLY[WEEKLY.length - 1].nudged)}
              r={4}
              fill="var(--chart-accent)"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={x(WEEKLY.length - 1)}
              cy={y(WEEKLY[WEEKLY.length - 1].holdout)}
              r={4}
              fill="var(--chart-track)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="mt-2 ml-9 flex justify-between text-[10px] text-quaternary">
          {WEEKLY.map((w) => (
            <span key={w.week}>{w.week}</span>
          ))}
        </div>

        <p className="mt-4 border-t border-secondary pt-3 text-xs leading-relaxed text-tertiary">
          {WEEKLY_NOTE}
        </p>
      </div>
    </Card>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-tertiary">
      <span className={`h-0.5 w-4 rounded-full ${className}`} />
      {label}
    </span>
  );
}
