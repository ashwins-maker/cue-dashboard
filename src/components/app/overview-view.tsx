import {
  CircleDollarSign,
  MessageCircleQuestion,
  TriangleAlert,
} from "lucide-react";
import { MetricCard } from "@/components/base/metric-card";
import { NudgeFunnel } from "@/components/app/overview-funnel";
import { SuppressionBreakdown } from "@/components/app/overview-suppression";
import { DemandBreakdown } from "@/components/app/overview-demand";
import {
  formatCurrency,
  type FrictionPoint,
  METRIC_NOTES,
  revenueAtRiskTotal,
  STORE,
} from "@/lib/merchant-data";
import {
  formatCount,
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
            Earned, still to earn, and the demand behind both. The two money
            figures are differences against the held-back group, never totals
            over nudged sessions — a shopper who saw a card and bought would
            very often have bought anyway. See lib/overview-data.ts.

            The third card is a count, and it is the one that should fall. A
            question that stops being asked has been answered on the page, so
            its own trend is the product working.

            Sales lift and returns avoided are one card, not two: returns
            avoided is part of net revenue added, so showing them side by side
            invites a merchant to add them together and double-count.
          */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Net revenue added"
              icon={CircleDollarSign}
              value={formatCurrency(netAdded)}
              info={{
                label: METRIC_NOTES.netRevenueAdded.label,
                body: METRIC_NOTES.netRevenueAdded.body,
              }}
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
              icon={TriangleAlert}
              value={formatCurrency(atRisk)}
              lowerIsBetter
              info={{
                label: METRIC_NOTES.revenueAtRisk.label,
                body: METRIC_NOTES.revenueAtRisk.body,
              }}
              hint={`Behind ${s.uncoveredCount} questions your pages cannot answer, so Cue stays silent on all of them. This is the work list.`}
            />
            <MetricCard
              label="Questions shoppers asked"
              icon={MessageCircleQuestion}
              value={formatCount(s.stuckEncounters)}
              lowerIsBetter
              change={
                s.demand
                  ? { value: s.demand.value, direction: s.demand.direction }
                  : undefined
              }
              info={{
                label: METRIC_NOTES.demandAnswered.label,
                body: METRIC_NOTES.demandAnswered.body,
                align: "right",
              }}
              hint={`${formatShare(s.resolvedShare)} were answered on the spot. ${s.movement.falling} of ${s.frictionPointCount} questions are being asked less than last period — falling is the goal.`}
            />
          </section>

          {/*
            The work list sits directly under the figures, not at the foot of
            the page. Everything above says how the store is doing; this is the
            only part a merchant can act on, so it comes before the breakdowns
            that explain it.
          */}
          <DemandBreakdown points={s.topPoints} topics={s.topicDemand} />

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
