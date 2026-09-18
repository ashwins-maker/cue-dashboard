import { TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { InfoTip } from "@/components/base/info-tip";
import { cx } from "@/lib/cx";
import { PERIOD_COMPARISON } from "@/lib/merchant-data";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  info,
  change,
  /**
   * Set when a falling number is the good outcome — retired questions, open
   * gaps, return rate. Without it a downward arrow always reads as bad.
   */
  lowerIsBetter = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /**
   * A quiet subject marker, not decoration. Kept monochrome so it never
   * competes with the value or implies a status the number does not carry.
   */
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Present when the figure is modelled, lagging, or correlational. */
  info?: { label: string; body: string; align?: "left" | "right" };
  /**
   * The movement since the last period. `comparison` names the baseline and
   * defaults to the dashboard's own period, so a delta can never ship without
   * saying what it is measured against.
   */
  change?: { value: string; direction: "up" | "down"; comparison?: string };
  lowerIsBetter?: boolean;
}) {
  const isGood = change
    ? lowerIsBetter
      ? change.direction === "down"
      : change.direction === "up"
    : undefined;

  const Arrow = change?.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-card border border-secondary bg-secondary p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-tertiary">
          {label}
          {info && (
            <InfoTip label={info.label} align={info.align ?? "left"}>
              {info.body}
            </InfoTip>
          )}
        </p>
        {Icon && (
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-alt text-quaternary"
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-primary tabular-nums">
          {value}
        </span>
        {change && (
          <span className="inline-flex items-baseline gap-1.5">
            <span
              className={cx(
                "inline-flex items-center gap-1 text-xs font-medium",
                isGood ? "text-success-primary" : "text-error-primary",
              )}
            >
              <Arrow className="size-3.5" strokeWidth={2} aria-hidden />
              {change.value}
            </span>
            <span className="text-xs text-quaternary">
              {change.comparison ?? PERIOD_COMPARISON}
            </span>
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-2.5 text-xs leading-relaxed text-tertiary">{hint}</p>
      )}
    </div>
  );
}
