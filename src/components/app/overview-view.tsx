import { MetricCard } from "@/components/base/metric-card";
import { DotGrid, MiniBar } from "@/components/base/mini-viz";
import { NudgeFunnel } from "@/components/app/overview-funnel";
import { SuppressionBreakdown } from "@/components/app/overview-suppression";
import { TopicDemandChart } from "@/components/app/overview-topic-chart";
import { TopFrictionPoints } from "@/components/app/overview-top-points";
import {
  formatCurrency,
  type FrictionPoint,
  METRIC_NOTES,
  STORE,
} from "@/lib/merchant-data";
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
            {/*
              Demand first. The product's claim is that a question stops being
              asked once its answer is on the page, so the total and its
              direction are the only figures that can show the product working
              at all. Everything after this explains it.
            */}
            <MetricCard
              label="Questions shoppers asked"
              value={formatCount(s.stuckEncounters)}
              emphasis
              lowerIsBetter
              change={
                s.demand
                  ? { value: s.demand.value, direction: s.demand.direction }
                  : undefined
              }
              info={{
                label: METRIC_NOTES.sessions.label,
                body: METRIC_NOTES.sessions.body,
              }}
              visual={
                <MiniBar
                  segments={[
                    {
                      value: s.movement.falling,
                      className: "bg-[var(--chart-positive)]",
                      label: `${s.movement.falling} asked less often`,
                    },
                    {
                      value: s.movement.flat,
                      className: "bg-[var(--chart-track)]",
                      label: `${s.movement.flat} unchanged`,
                    },
                    {
                      value: s.movement.rising,
                      className: "bg-[var(--chart-negative)]",
                      label: `${s.movement.rising} asked more often`,
                    },
                  ]}
                />
              }
              hint={`${s.movement.falling} of ${s.frictionPointCount} questions are being asked less than last period. Falling is the goal.`}
            />

            <MetricCard
              label="Answered on the spot"
              value={formatShare(s.resolvedShare)}
              visual={
                <MiniBar
                  segments={[
                    {
                      value: s.resolved,
                      className: "bg-[var(--chart-positive)]",
                      label: "Hesitation ended",
                    },
                    {
                      value: Math.max(0, s.nudgesShown - s.resolved),
                      className: "bg-[var(--chart-track)]",
                      label: "Still hesitating",
                    },
                  ]}
                />
              }
              hint={`Cue answered ${formatCount(s.nudgesShown)} times. In ${formatCount(s.resolved)} of them the shopper stopped flipping sizes, reopening the size chart, or hunting for the returns policy.`}
            />

            <MetricCard
              label="Nothing on the page to answer with"
              value={formatCurrency(s.revenueAtRisk)}
              lowerIsBetter
              change={
                s.uncoveredDemand
                  ? {
                      value: s.uncoveredDemand.value,
                      direction: s.uncoveredDemand.direction,
                    }
                  : undefined
              }
              info={{
                label: METRIC_NOTES.revenueAtRisk.label,
                body: METRIC_NOTES.revenueAtRisk.body,
              }}
              visual={
                <DotGrid
                  total={s.frictionPointCount}
                  filled={s.uncoveredCount}
                  label={`${s.uncoveredCount} of ${s.frictionPointCount} friction points have no answer on the page.`}
                />
              }
              hint={`${formatCount(s.uncoveredSessions)} shoppers hit ${s.uncoveredCount} questions your store cannot answer. This is the work list.`}
            />

            <MetricCard
              label="Cue stayed quiet"
              value={formatShare(s.quietShare)}
              info={{
                label: METRIC_NOTES.holdout.label,
                body: METRIC_NOTES.holdout.body,
                align: "right",
              }}
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
              hint={`Of the moments it could have spoken, it held back ${formatCount(s.suppressed)} times. Silence is the default.`}
            />
          </section>

          {/*
            The work list sits directly under the figures, not at the foot of
            the page. Everything above says how the store is doing; this is the
            only part a merchant can act on, so it comes before the breakdowns
            that explain it.
          */}
          <TopFrictionPoints points={s.topPoints} />

          <TopicDemandChart rows={s.topicDemand} />

          <section className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <NudgeFunnel
                steps={s.funnel}
                dismissed={s.nudgesDismissed}
                resolved={s.resolved}
                resolvedShare={s.resolvedShare}
              />
            </div>
            <div className="lg:col-span-3">
              <SuppressionBreakdown
                reasons={s.suppression}
                total={s.suppressed}
                quietShare={s.quietShare}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
