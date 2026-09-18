"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CatalogCoverage } from "@/components/app/catalog-coverage";
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
        One full-width band rather than a headline card and a companion. The
        supporting counts sit beside the money instead of under it, so the
        row reads left to right as one sentence: this much is at stake, across
        this many questions, this many of which you cannot answer at all.

        "Potential" is doing real work in the label. The figure is a
        conversion gap multiplied by a price — an association, not money a
        merchant would be handed back — and the tooltip carries the rest.
      */}
      <section className="rounded-card border border-secondary bg-feature p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-brand-secondary uppercase">
              Potential revenue at risk
              <InfoTip label={METRIC_NOTES.revenueAtRisk.label}>
                {METRIC_NOTES.revenueAtRisk.body}
              </InfoTip>
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-primary tabular-nums">
                {formatCurrency(atRisk)}
              </span>
              <span className="max-w-[13rem] text-xs leading-snug text-tertiary">
                across the questions your pages cannot answer
              </span>
            </div>
          </div>

          <dl className="flex flex-wrap items-center gap-x-10 gap-y-5">
            <HeroStat label="Questions open" value={String(ranked.length)} />
            <HeroStat label="You can't answer" value={String(uncoveredCount)} />
            <HeroStat label="Fixed this period" value="7" />
          </dl>
        </div>
      </section>

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
              <Th className="w-[40%]">Friction point</Th>
              <Th>How we know</Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1">
                  Shoppers
                  <InfoTip label={METRIC_NOTES.sessions.label}>
                    {METRIC_NOTES.sessions.body}
                  </InfoTip>
                </span>
                <span className="block font-normal text-quaternary normal-case">
                  and change {PERIOD_COMPARISON}
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
        <p className="text-[13px] font-medium text-primary">{point.summary}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-tertiary">
          {point.productTitle && <>{point.productTitle} · </>}
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-tertiary">{label}</dt>
      <dd className="mt-1 text-[17px] leading-none font-semibold text-primary tabular-nums">
        {value}
      </dd>
    </div>
  );
}
