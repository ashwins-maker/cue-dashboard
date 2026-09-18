import { Card, CardHeader } from "@/components/base/card";
import { formatShare, journey } from "@/lib/overview-data";

/**
 * Drawn as nested bars against a common baseline rather than a tapering
 * funnel: each step's width is its share of the first, so the drop between
 * two steps is a length a reader can compare directly instead of a slope they
 * have to judge.
 */
export function NudgeToOrder() {
  const steps = journey();

  return (
    <Card>
      <CardHeader title="From nudge to order" />
      <div className="flex flex-col gap-4 px-5 py-5">
        {steps.map((step, index) => (
          <div key={step.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-secondary">{step.label}</span>
              <span className="text-[13px] font-medium text-primary tabular-nums">
                {step.value.toLocaleString()}
                {index > 0 && (
                  <span className="ml-1.5 font-normal text-quaternary">
                    {formatShare(step.share)}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-quaternary">
              <div
                className="h-full rounded-full bg-brand-solid"
                style={{
                  width: `${Math.max(step.share * 100, 1.5)}%`,
                  opacity: 1 - index * 0.18,
                }}
              />
            </div>
          </div>
        ))}

        <p className="border-t border-secondary pt-3 text-xs leading-relaxed text-tertiary">
          Every step here is a counted event. Only the revenue figure above is
          modelled.
        </p>
      </div>
    </Card>
  );
}
