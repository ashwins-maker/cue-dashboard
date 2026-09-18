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
  revenueAtRiskTotal,
  STORE,
} from "@/lib/merchant-data";
import {
  formatShare,
  netRevenueAdded,
  REVENUE,
  returnsAvoidedOrders,
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
  const netAdded = netRevenueAdded();
  const returnsAvoided = returnsAvoidedOrders();
  const atRisk = revenueAtRiskTotal(points);

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
          {/*
            Earned, still to earn, already fixed. Every money figure is a
            difference against the held-back group, never a total over nudged
            sessions — a shopper who saw a card and bought would very often
            have bought anyway. See the REVENUE block in lib/overview-data.ts.

            Sales lift and returns avoided are one card, not two: returns
            avoided is part of net revenue added, so showing them side by side
            invites a merchant to add them together and double-count.
          */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Net revenue added"
              value={formatCurrency(netAdded)}
              emphasis
              info={{
                label: METRIC_NOTES.netRevenueAdded.label,
                body: METRIC_NOTES.netRevenueAdded.body,
              }}
              visual={
                <MiniBar
                  segments={[
                    {
                      value: REVENUE.liftFromSales,
                      className: "bg-[var(--chart-positive)]",
                      label: `${formatCurrency(REVENUE.liftFromSales)} from sales that closed`,
                    },
                    {
                      value: REVENUE.liftFromFewerReturns,
                      className: "bg-[var(--chart-accent)]",
                      label: `${formatCurrency(REVENUE.liftFromFewerReturns)} from returns that did not happen`,
                    },
                  ]}
                />
              }
              hint={
                <>
                  {formatCurrency(REVENUE.liftFromSales)} from extra sales, plus{" "}
                  {formatCurrency(REVENUE.liftFromFewerReturns)} from{" "}
                  {returnsAvoided} orders that did not come back —{" "}
                  {formatShare(REVENUE.nudgedReturnRate)} against{" "}
                  {formatShare(REVENUE.holdoutReturnRate)} of the held-back
                  group.
                </>
              }
            />
            <MetricCard
              label="Revenue at risk"
              value={formatCurrency(atRisk)}
              lowerIsBetter
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
              hint={`Behind ${s.uncoveredCount} questions your pages cannot answer, so Cue stays silent on all of them. This is the work list.`}
            />
            <MetricCard
              label="Recovered by fixing pages"
              value={formatCurrency(REVENUE.gapsClosedValue)}
              info={{
                label: METRIC_NOTES.gapsClosed.label,
                body: METRIC_NOTES.gapsClosed.body,
                align: "right",
              }}
              visual={
                <MiniBar
                  segments={[
                    {
                      value: REVENUE.gapsClosedValue,
                      className: "bg-[var(--chart-positive)]",
                      label: "Questions answered on the page",
                    },
                    {
                      value: atRisk,
                      className: "bg-[var(--chart-track)]",
                      label: "Still unanswered",
                    },
                  ]}
                />
              }
              hint={`${REVENUE.gapsClosed} questions stopped being asked after you added the answer. Cue no longer has to speak for them.`}
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
