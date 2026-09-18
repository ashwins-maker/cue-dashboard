import { CircleAlert } from "lucide-react";
import { formatCurrency } from "@/lib/merchant-data";
import {
  CONFIDENCE,
  confidenceShare,
  netRevenueAdded,
  ordersInfluenced,
  REVENUE,
  SUBSCRIPTION_COST,
} from "@/lib/overview-data";

/**
 * The headline claim and, beside it, how much that claim can currently bear.
 *
 * They are deliberately the same size. A revenue figure shown on its own
 * invites a merchant to quote it; shown next to the sample it rests on, it
 * invites them to ask whether it is quotable yet — which, at this traffic, it
 * is not. Separating them into a big number and a footnote would lose that.
 */
export function RevenueHeadline() {
  const recovered = netRevenueAdded();
  const orders = ordersInfluenced();
  const share = confidenceShare();
  const settled = share >= 1;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <div className="rounded-card border border-brand bg-feature p-6 shadow-glow">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-secondary uppercase">
          Revenue recovered
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
          <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-primary tabular-nums">
            {formatCurrency(recovered)}
          </span>
          <span className="max-w-[9rem] text-xs leading-snug text-tertiary">
            above the group Cue was held back from
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-secondary pt-4">
          <Stat
            label="You paid Cue"
            value={formatCurrency(SUBSCRIPTION_COST)}
          />
          <Stat label="Orders influenced" value={orders.toLocaleString()} />
          <Stat
            label="Avg order value"
            value={formatCurrency(REVENUE.averageOrderValue)}
          />
        </dl>
      </div>

      <div className="rounded-card border border-secondary bg-secondary p-6 shadow-card">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-tertiary uppercase">
          <CircleAlert className="size-3.5" strokeWidth={2} aria-hidden />
          How sure is this
        </p>

        <p className="mt-3 text-[15px] leading-relaxed text-primary">
          Based on{" "}
          <span className="font-semibold tabular-nums">
            {CONFIDENCE.sessions.toLocaleString()} sessions
          </span>
          .{" "}
          {settled
            ? "That is enough to quote the figure itself, not only its direction."
            : "That is enough to see a direction, not enough to call the exact number."}
        </p>

        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-quaternary"
          role="img"
          aria-label={`${Math.round(share * 100)}% of the sample needed to quote the figure`}
        >
          <div
            className="h-full rounded-full bg-brand-solid"
            style={{ width: `${share * 100}%` }}
          />
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-tertiary">
          {settled ? (
            "The sample is large enough that the number itself is worth quoting."
          ) : (
            <>
              At your current traffic this figure becomes reliable in about{" "}
              <span className="font-medium text-secondary">
                {CONFIDENCE.weeksRemaining} weeks
              </span>
              . Until then, trust the direction and not the decimal.
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-tertiary">{label}</dt>
      <dd className="mt-1 text-[17px] leading-none font-semibold text-primary tabular-nums">
        {value}
      </dd>
    </div>
  );
}
