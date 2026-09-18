import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { InfoTip } from "@/components/base/info-tip";
import { cx } from "@/lib/cx";

export interface BandStat {
  label: string;
  value: string;
}

/**
 * A page's headline figure and the counts that qualify it, on one line.
 *
 * Used in place of a row of equal cards where one number is the point of the
 * page and the rest are its context. Four cards of the same size make a reader
 * work out which matters; this makes the hierarchy the layout's job, and reads
 * left to right as a sentence — this much, across this many, of which this
 * many are the problem.
 */
export function StatBand({
  label,
  info,
  value,
  caption,
  change,
  stats,
}: {
  label: string;
  info?: { label: string; body: string };
  value: string;
  /** Sits beside the value, wrapping to at most a couple of lines. */
  caption: ReactNode;
  change?: { value: string; direction: "up" | "down"; comparison: string };
  stats: BandStat[];
}) {
  const Arrow = change?.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <section className="rounded-card border border-secondary bg-feature p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-brand-secondary uppercase">
            {label}
            {info && <InfoTip label={info.label}>{info.body}</InfoTip>}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-primary tabular-nums">
              {value}
            </span>
            {change && (
              <span
                className={cx(
                  "inline-flex items-center gap-1 pb-1 text-xs font-medium",
                  change.direction === "up"
                    ? "text-success-primary"
                    : "text-error-primary",
                )}
              >
                <Arrow className="size-3.5" strokeWidth={2} aria-hidden />
                {change.value}
                <span className="font-normal text-quaternary">
                  {change.comparison}
                </span>
              </span>
            )}
            <span className="max-w-[15rem] text-xs leading-snug text-tertiary">
              {caption}
            </span>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-10 gap-y-5">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[11px] text-tertiary">{stat.label}</dt>
              <dd className="mt-1 text-[17px] leading-none font-semibold text-primary tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
