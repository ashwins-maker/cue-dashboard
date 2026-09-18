import { DemandBreakdown } from "@/components/app/overview-demand";
import { NudgeToOrder } from "@/components/app/overview-journey";
import { MessagesTable } from "@/components/app/overview-messages";
import { RevenueHeadline } from "@/components/app/overview-revenue";
import { WeeklyConversion } from "@/components/app/overview-weekly";
import { type FrictionPoint, STORE } from "@/lib/merchant-data";
import { summariseOverview } from "@/lib/overview-data";

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

          <section className="grid gap-4 lg:grid-cols-2">
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
