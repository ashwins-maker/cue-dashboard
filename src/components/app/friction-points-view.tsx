"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CatalogCoverage } from "@/components/app/catalog-coverage";
import { ProductCell } from "@/components/base/product-cell";
import { StatBand } from "@/components/base/stat-band";
import { FrictionPanel } from "@/components/app/friction-panel";
import { Badge, type BadgeColor } from "@/components/base/badge";
import { ButtonGroup } from "@/components/base/button-group";
import { Card, CardHeader } from "@/components/base/card";
import { InfoTip } from "@/components/base/info-tip";
import { Table, Td, Th, Tr } from "@/components/base/table";
import {
  CONTENT_LABEL,
  type ContentState,
  formatCurrency,
  formatPercent,
  type FrictionPoint,
  METRIC_NOTES,
  PERIOD_COMPARISON,
  revenueAtRisk,
  revenueAtRiskTotal,
  type SignalSource,
  SOURCE_LABEL,
  TOPIC_LABEL,
} from "@/lib/merchant-data";

// Direct and topic signals came from the shopper; the other two are our reading
// of behaviour. The colour carries that distinction at a glance.
const SOURCE_COLOR: Record<SignalSource, BadgeColor> = {
  direct: "brand",
  topic: "brand",
  abandoned: "gray",
  behavioural: "gray",
};

const CONTENT_COLOR: Record<ContentState, BadgeColor> = {
  covered: "success",
  low_confidence: "warning",
  uncovered: "error",
};

type Filter = "all" | "uncovered" | "covered";

export function FrictionPointsView({ points }: { points: FrictionPoint[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ranked = useMemo(
    () => [...points].sort((a, b) => revenueAtRisk(b) - revenueAtRisk(a)),
    [points],
  );

  const rows = useMemo(() => {
    if (filter === "uncovered")
      return ranked.filter((p) => p.contentState === "uncovered");
    if (filter === "covered")
      return ranked.filter((p) => p.contentState !== "uncovered");
    return ranked;
  }, [filter, ranked]);

  const uncoveredCount = ranked.filter(
    (p) => p.contentState === "uncovered",
  ).length;
  const atRisk = revenueAtRiskTotal(ranked);

  const selected = ranked.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-primary">
          Customer friction points
        </h1>
        <p className="mt-1 text-[13px] text-tertiary">
          Ranked by revenue at risk, not by frequency. Falling demand is the
          goal — a friction point that disappears has been resolved.
        </p>
      </div>

      {/*
        "Potential" is doing real work in the label. The figure is a
        conversion gap multiplied by a price — an association, not money a
        merchant would be handed back — and the tooltip carries the rest.
      */}
      <StatBand
        label="Potential revenue at risk"
        info={METRIC_NOTES.revenueAtRisk}
        value={formatCurrency(atRisk)}
        caption="across the questions your pages cannot answer"
        stats={[
          { label: "Questions open", value: String(ranked.length) },
          { label: "You can't answer", value: String(uncoveredCount) },
          { label: "Fixed this period", value: "7" },
        ]}
      />

      <Card>
        <CardHeader
          title="Friction points"
          description={`${rows.length} of ${ranked.length} shown · select a row for detail and next steps`}
          actions={
            <ButtonGroup<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: ranked.length },
                {
                  value: "uncovered",
                  label: "Not covered",
                  count: uncoveredCount,
                },
                {
                  value: "covered",
                  label: "Covered",
                  count: ranked.length - uncoveredCount,
                },
              ]}
            />
          }
        />

        <Table>
          <thead>
            <tr>
              <Th className="w-[30%]">Friction point</Th>
              <Th className="w-[17%]">Product</Th>
              <Th>How we know</Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1">
                  Shoppers
                  <InfoTip label={METRIC_NOTES.sessions.label}>
                    {METRIC_NOTES.sessions.body}
                  </InfoTip>
                </span>
                <span className="block font-normal text-quaternary normal-case">
                  {PERIOD_COMPARISON}
                </span>
              </Th>
              <Th>Your page</Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1">
                  Bought
                  <InfoTip label={METRIC_NOTES.conversionComparison.label}>
                    {METRIC_NOTES.conversionComparison.body}
                  </InfoTip>
                </span>
              </Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1">
                  Returns
                  <InfoTip label={METRIC_NOTES.returnRate.label} align="right">
                    {METRIC_NOTES.returnRate.body}
                  </InfoTip>
                </span>
              </Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1">
                  At risk
                  <InfoTip
                    label={METRIC_NOTES.revenueAtRisk.label}
                    align="right"
                  >
                    {METRIC_NOTES.revenueAtRisk.body}
                  </InfoTip>
                </span>
              </Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((point) => (
              <FrictionRow
                key={point.id}
                point={point}
                selected={point.id === selectedId}
                onSelect={() => setSelectedId(point.id)}
              />
            ))}
          </tbody>
        </Table>
      </Card>

      <CatalogCoverage />

      <FrictionPanel point={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function FrictionRow({
  point,
  selected,
  onSelect,
}: {
  point: FrictionPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  const belowBaseline = point.conversion < point.baseline;

  return (
    <Tr onClick={onSelect} selected={selected}>
      <Td className="align-middle">
        {/* A width class on the <th> does not bind in an auto-layout table —
            the widest cell content wins. A min-width on a block inside the
            cell is the one place the constraint holds, so the summary keeps
            its two lines instead of collapsing to a column of single words. */}
        <div className="min-w-[230px]">
          <p className="text-[13px] font-medium text-primary">
            {point.summary}
          </p>
          <p className="mt-0.5 text-[11px] text-tertiary">
            {TOPIC_LABEL[point.topic]}
          </p>
          {point.verbatim && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-quaternary italic">
              &ldquo;{point.verbatim[0]}&rdquo;
              {point.verbatim.length > 1 && (
                <span className="not-italic">
                  {" "}
                  +{point.verbatim.length - 1} more
                </span>
              )}
            </p>
          )}
        </div>
      </Td>

      <Td className="align-middle">
        <div className="min-w-[150px]">
          <ProductCell title={point.productTitle} />
        </div>
      </Td>

      <Td className="align-middle">
        <Badge color={SOURCE_COLOR[point.source]}>
          {SOURCE_LABEL[point.source]}
        </Badge>
      </Td>

      <Td className="text-right align-middle">
        <span className="font-medium text-primary tabular-nums">
          {point.sessions.toLocaleString()}
        </span>
        <span
          className={
            point.trend.direction === "down"
              ? "mt-0.5 block text-[11px] text-success-primary tabular-nums"
              : "mt-0.5 block text-[11px] text-error-primary tabular-nums"
          }
        >
          {point.trend.value}
        </span>
      </Td>

      <Td className="align-middle">
        <Badge color={CONTENT_COLOR[point.contentState]} dot>
          {CONTENT_LABEL[point.contentState]}
        </Badge>
      </Td>

      <Td className="text-right align-middle">
        <span
          className={
            belowBaseline
              ? "font-medium text-error-primary tabular-nums"
              : "font-medium text-success-primary tabular-nums"
          }
        >
          {formatPercent(point.conversion)}
        </span>
        <span className="mt-0.5 block text-[11px] text-quaternary tabular-nums">
          vs {formatPercent(point.baseline)}
        </span>
      </Td>

      <Td className="text-right align-middle">
        {point.returnRate === null ? (
          <span className="text-[11px] text-quaternary">Pending</span>
        ) : (
          <span
            className={
              point.returnRate > 0.1
                ? "font-medium text-error-primary tabular-nums"
                : "font-medium text-secondary tabular-nums"
            }
          >
            {formatPercent(point.returnRate)}
          </span>
        )}
      </Td>

      <Td className="text-right align-middle font-medium text-primary tabular-nums">
        {formatCurrency(revenueAtRisk(point))}
      </Td>

      <Td className="align-middle">
        <ChevronRight
          className="size-4 text-quaternary"
          strokeWidth={2}
          aria-hidden
        />
      </Td>
    </Tr>
  );
}
