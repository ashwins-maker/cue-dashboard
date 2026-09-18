import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/base/badge";
import { Card, CardHeader } from "@/components/base/card";
import { InfoTip } from "@/components/base/info-tip";
import { Table, Td, Th, Tr } from "@/components/base/table";
import {
  formatPercent,
  type FrictionPoint,
  METRIC_NOTES,
  TOPIC_LABEL,
} from "@/lib/merchant-data";
import { formatCount } from "@/lib/overview-data";
import { cx } from "@/lib/cx";

/**
 * The five things shoppers got stuck on most, ranked by how many hit it.
 *
 * Columns are limited to wired sources. There is no "change against last
 * period" column, because `trend` is unwired — nothing compares consecutive
 * periods yet, and a trend arrow is the easiest number on a dashboard to
 * believe without checking.
 *
 * Content state renders as covered / not covered only. The `low_confidence`
 * middle state is unwired, so a thin answer is shown as covered rather than
 * given a badge the backend cannot justify.
 */
export function TopFrictionPoints({ points }: { points: FrictionPoint[] }) {
  return (
    <Card>
      <CardHeader
        title="What got in the way most"
        description="Ranked by how many shoppers hit it."
        actions={
          <Link
            href="/friction-points"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-secondary bg-secondary px-3 text-[12px] font-medium text-secondary transition-colors hover:bg-tertiary hover:text-primary"
          >
            All friction points
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
          </Link>
        }
      />

      {points.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-tertiary">
          Nothing recorded yet for this period.
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Friction point</Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1.5">
                  Shoppers
                  <InfoTip label={METRIC_NOTES.sessions.label}>
                    {METRIC_NOTES.sessions.body}
                  </InfoTip>
                </span>
              </Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1.5">
                  Bought
                  <InfoTip
                    label={METRIC_NOTES.conversionComparison.label}
                    align="right"
                  >
                    {METRIC_NOTES.conversionComparison.body}
                  </InfoTip>
                </span>
              </Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1.5">
                  Returns
                  <InfoTip label={METRIC_NOTES.returnRate.label} align="right">
                    {METRIC_NOTES.returnRate.body}
                  </InfoTip>
                </span>
              </Th>
              <Th className="whitespace-nowrap">Your page</Th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => {
              const below = point.conversion < point.baseline;
              const uncovered = point.contentState === "uncovered";

              return (
                <Tr key={point.id}>
                  <Td>
                    {/* A max-width on the <td> itself is only advisory in an
                        auto-layout table, and max-w-0 collapses the column
                        outright. A block wrapper inside the cell is the one
                        place the constraint actually binds. */}
                    <div className="max-w-[300px]">
                      <p className="truncate font-medium text-primary">
                        {point.summary}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-quaternary">
                        {TOPIC_LABEL[point.topic]}
                        {point.productTitle && ` · ${point.productTitle}`}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-right font-medium text-primary tabular-nums">
                    {formatCount(point.sessions)}
                  </Td>
                  <Td className="text-right tabular-nums whitespace-nowrap">
                    <span
                      className={cx(
                        "font-medium",
                        below ? "text-error-primary" : "text-success-primary",
                      )}
                    >
                      {formatPercent(point.conversion)}
                    </span>
                    <span className="ml-1.5 text-[11px] text-quaternary">
                      vs {formatPercent(point.baseline)}
                    </span>
                  </Td>
                  <Td className="text-right text-secondary tabular-nums">
                    {point.returnRate === null
                      ? "—"
                      : formatPercent(point.returnRate)}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Badge color={uncovered ? "error" : "success"}>
                      {uncovered ? "Not covered" : "Covered"}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
