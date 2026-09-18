import { MetricCard } from "@/components/base/metric-card";
import { DotGrid, MiniBar } from "@/components/base/mini-viz";
import { NudgeFunnel } from "@/components/app/overview-funnel";
import { IntentChart } from "@/components/app/overview-intent-chart";
import { SuppressionBreakdown } from "@/components/app/overview-suppression";
import { TopicDemandChart } from "@/components/app/overview-topic-chart";
import { TopFrictionPoints } from "@/components/app/overview-top-points";
import { type FrictionPoint, METRIC_NOTES, STORE } from "@/lib/merchant-data";
import {
  formatCount,
  formatShare,
  summariseOverview,
} from "@/lib/overview-data";

/**
 * The overview screen.
 *
 * Every figure is backed by a source `WIRING` marks wired — see the header
 * comment in lib/overview-data.ts for what was left out and why.
 *
 * The micro-visuals on the metric cards are compositions, never trends: there
 * is no time series anywhere in this data, so a sparkline would be a drawn
 * assertion about change that nothing measured.
 *
 * Nothing here updates on its own, which the period line says outright.
 */
export function OverviewView({ points }: { points: FrictionPoint[] }) {
  const s = summariseOverview(points);
  const answeredSessions = s.stuckEncounters - s.uncoveredSessions;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-[20px] font-semibold tracking-tight text-primary">
          Overview
        </h1>
        <p className="text-[12px] text-tertiary">
          {STORE.period} · snapshot, reload to refresh
        </p>
      </header>

      {!s.hasData ? (
        <div className="rounded-card border border-secondary bg-secondary px-5 py-12 text-center">
          <p className="text-[14px] font-medium text-primary">
            Nothing recorded yet
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-tertiary">
            The store is connected but no shopper sessions have come through for{" "}
            {STORE.period.toLowerCase()}. This screen fills in on its own once
            traffic arrives — there is nothing to set up.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Questions Cue settled"
              value={formatCount(s.resolved)}
              emphasis
              change={{
                value: `${formatShare(s.resolvedShare)} of what it said`,
                direction: "up",
              }}
              visual={
                <MiniBar
                  segments={[
                    {
                      value: s.resolved,
                      className: "bg-[var(--chart-positive)]",
                      label: "Settled",
                    },
                    {
                      value: Math.max(0, s.nudgesShown - s.resolved),
                      className: "bg-[var(--chart-track)]",
                      label: "Not settled",
                    },
                  ]}
                />
              }
              hint="The shopper stopped flipping sizes, reopening the size chart, or hunting for the returns policy."
            />
            <MetricCard
              label="Shoppers Cue could not help"
              value={formatCount(s.uncoveredSessions)}
              lowerIsBetter
              visual={
                <MiniBar
                  segments={[
                    {
                      value: s.uncoveredSessions,
                      className: "bg-[var(--chart-negative)]",
                      label: "Nothing on the page",
                    },
                    {
                      value: answeredSessions,
                      className: "bg-[var(--chart-track)]",
                      label: "Your pages had the answer",
                    },
                  ]}
                />
              }
              info={{
                label: METRIC_NOTES.sessions.label,
                body: METRIC_NOTES.sessions.body,
              }}
              hint={`Of ${formatCount(s.stuckEncounters)} times a shopper got stuck, these found nothing on the page.`}
            />
            <MetricCard
              label="Gaps in your pages"
              value={formatCount(s.uncoveredCount)}
              lowerIsBetter
              visual={
                <DotGrid
                  total={s.frictionPointCount}
                  filled={s.uncoveredCount}
                  label={`${s.uncoveredCount} of ${s.frictionPointCount} friction points have no answer on the page.`}
                />
              }
              hint={`${s.uncoveredCount} of ${s.frictionPointCount} things shoppers ask about have nothing in your store to answer them.`}
            />
            <MetricCard
              label="Times Cue stayed quiet"
              value={formatCount(s.suppressed)}
              visual={
                <MiniBar
                  segments={[
                    {
                      value: s.suppressed,
                      className: "bg-[var(--chart-track)]",
                      label: "Held back",
                    },
                    {
                      value: s.nudgesShown,
                      className: "bg-[var(--chart-accent)]",
                      label: "Spoke",
                    },
                  ]}
                />
              }
              hint={`${formatShare(s.quietShare)} of the moments it could have spoken. It spoke ${formatCount(s.nudgesShown)} times.`}
            />
          </section>

          <IntentChart rows={s.intentPerformance} />

          <section className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <TopicDemandChart rows={s.topicDemand} />
            </div>
            <div className="lg:col-span-2">
              <NudgeFunnel
                steps={s.funnel}
                dismissed={s.nudgesDismissed}
                resolved={s.resolved}
                resolvedShare={s.resolvedShare}
              />
            </div>
          </section>

          <SuppressionBreakdown
            reasons={s.suppression}
            total={s.suppressed}
            quietShare={s.quietShare}
          />

          <TopFrictionPoints points={s.topPoints} />
        </>
      )}
    </div>
  );
}
