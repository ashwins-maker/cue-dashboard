import { CircleDollarSign, MessageCircleQuestion } from "lucide-react";
import { MetricCard } from "@/components/base/metric-card";
import { DemandBreakdown } from "@/components/app/overview-demand";
import { NudgeToOrder } from "@/components/app/overview-journey";
import { MessagesTable } from "@/components/app/overview-messages";
import { RevenueHeadline } from "@/components/app/overview-revenue";
import { WeeklyConversion } from "@/components/app/overview-weekly";
import { type FrictionPoint, STORE } from "@/lib/merchant-data";
import {
  ARMS,
  formatCount,
  formatShare,
  REVENUE,
  summariseOverview,
} from "@/lib/overview-data";
import { NUDGE_TOTALS } from "@/lib/nudge-data";

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
          <RevenueHeadline />

          {/*
            The four rates that sit under the money. Add to cart and conversion
            carry their holdout counterpart inline rather than as a separate
            card: the pair is the claim, and splitting them invites reading the
            nudged rate on its own.
          */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Nudges shown"
              icon={MessageCircleQuestion}
              value={formatCount(REVENUE.nudgedSessions)}
              hint={`Across ${formatCount(s.sessionsObserved)} visits. One shopper in ${Math.round(s.visitsPerNudge)} sees a card at all.`}
            />
            <MetricCard
              label="Engaged with it"
              value={formatShare(
                s.nudgesShown > 0 ? NUDGE_TOTALS.engaged / s.nudgesShown : 0,
              )}
              hint={`${formatCount(NUDGE_TOTALS.engaged)} shoppers expanded a card or used its action.`}
            />
            <MetricCard
              label="Added to cart"
              value={formatShare(ARMS.addedToCartNudged)}
              change={{
                value: formatShare(
                  ARMS.addedToCartNudged / ARMS.addedToCartHoldout - 1,
                ),
                direction: "up",
                comparison: "against holdout",
              }}
              hint={`${formatShare(ARMS.addedToCartHoldout)} among the shoppers Cue was held back from.`}
            />
            <MetricCard
              label="Placed an order"
              icon={CircleDollarSign}
              value={formatShare(ARMS.convertedNudged)}
              change={{
                value: formatShare(
                  ARMS.convertedNudged / ARMS.convertedHoldout - 1,
                ),
                direction: "up",
                comparison: "against holdout",
              }}
              hint={`${formatShare(ARMS.convertedHoldout)} among the shoppers Cue was held back from.`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <WeeklyConversion />
            <NudgeToOrder />
          </section>

          <MessagesTable />

          {/*
            The work list last, but with the two figures it needs to be acted
            on: what each question is costing, and whether your pages can
            answer it at all.
          */}
          <DemandBreakdown points={s.topPoints} topics={s.topicDemand} />
        </>
      )}
    </div>
  );
}
