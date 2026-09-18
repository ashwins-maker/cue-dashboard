import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { InfoTip } from "@/components/base/info-tip";
import { cx } from "@/lib/cx";

export function MetricCard({
  label,
  value,
  hint,
  visual,
  info,
  change,
  /**
   * Set when a falling number is the good outcome — retired questions, open
   * gaps, return rate. Without it a downward arrow always reads as bad.
   */
  lowerIsBetter = false,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** A small inline chart sitting between the value and the hint. */
  visual?: ReactNode;
  /** Present when the figure is modelled, lagging, or correlational. */
  info?: { label: string; body: string; align?: "left" | "right" };
  /** Marks the figure as placeholder. Renders nothing once the field is wired. */
  change?: { value: string; direction: "up" | "down" };
  lowerIsBetter?: boolean;
  emphasis?: boolean;
}) {
  const isGood = change
    ? lowerIsBetter
      ? change.direction === "down"
      : change.direction === "up"
    : undefined;

  const Arrow = change?.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <div
      className={cx(
        "rounded-card border p-5",
        emphasis
          ? "border-brand bg-feature shadow-glow"
          : "border-secondary bg-secondary shadow-card",
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-tertiary">
        {label}
        {info && (
          <InfoTip label={info.label} align={info.align ?? "left"}>
            {info.body}
          </InfoTip>
        )}
      </p>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-primary tabular-nums">
          {value}
        </span>
        {change && (
          <span
            className={cx(
              "inline-flex items-center gap-1 text-xs font-medium",
              isGood ? "text-success-primary" : "text-error-primary",
            )}
          >
            <Arrow className="size-3.5" strokeWidth={2} aria-hidden />
            {change.value}
          </span>
        )}
      </div>
      {visual && <div className="mt-3">{visual}</div>}
      {hint && (
        <p className="mt-2.5 text-xs leading-relaxed text-tertiary">{hint}</p>
      )}
    </div>
  );
}
