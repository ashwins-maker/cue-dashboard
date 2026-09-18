"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/base/badge";
import { ButtonGroup } from "@/components/base/button-group";
import { Card, CardHeader } from "@/components/base/card";
import { InfoTip } from "@/components/base/info-tip";
import { Table, Td, Th, Tr } from "@/components/base/table";
import { cx } from "@/lib/cx";
import {
  formatPercent,
  type FrictionPoint,
  METRIC_NOTES,
  TOPIC_LABEL,
} from "@/lib/merchant-data";
import { formatCount, type TopicDemand } from "@/lib/overview-data";

/**
 * Where shoppers got stuck, at two grain sizes.
 *
 * These were two cards stacked on top of each other, showing the same demand
 * counted two ways — once per question, once rolled up by topic. Same source,
 * same period, same totals, so a merchant had to notice that for themselves.
 * One card with a switch says it outright: these are two views, not two
 * findings.
 *
 * Questions is the default because it is the actionable grain — a merchant
 * fixes "does it shrink", not "washing & care".
 */

type View = "questions" | "topics";

export function DemandBreakdown({
  points,
  topics,
}: {
  points: FrictionPoint[];
  topics: TopicDemand[];
}) {
  const [view, setView] = useState<View>("questions");

  return (
    <Card>
      <CardHeader
        title="Where shoppers got stuck"
        description={
          view === "questions"
            ? "The five that got in the way most, ranked by how many shoppers hit them."
            : "Every hesitation rolled up by topic. Red is the part your pages cannot answer."
        }
        actions={
          <div className="flex items-center gap-2">
            <ButtonGroup<View>
              value={view}
              onChange={setView}
              options={[
                {
                  value: "questions",
                  label: "Questions",
                  count: points.length,
                },
                { value: "topics", label: "Topics", count: topics.length },
              ]}
            />
            <Link
              href="/friction-points"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-secondary bg-secondary px-3 text-[12px] font-medium text-secondary transition-colors hover:bg-tertiary hover:text-primary"
            >
              All friction points
              <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Link>
          </div>
        }
      />

      {view === "questions" ? (
        <QuestionRows points={points} />
      ) : (
        <TopicRows rows={topics} />
      )}
    </Card>
  );
}

/* --------------------------------------------------------------- questions */

function QuestionRows({ points }: { points: FrictionPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-tertiary">
        Nothing recorded yet for this period.
      </p>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Question</Th>
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
                <div className="max-w-[340px]">
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
                  vs {formatPercent(point.baseline)} comparable
                </span>
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
  );
}

/* ------------------------------------------------------------------ topics */

const LABEL_W = 136;
const VALUE_W = 46;
const GAP = 12;

/** Round the axis maximum up to something a person would choose. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 1.5, 2, 2.5, 5, 10];
  for (const step of steps) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

function TopicRows({ rows }: { rows: TopicDemand[] }) {
  const max = niceMax(Math.max(0, ...rows.map((r) => r.sessions)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  const grid = {
    gridTemplateColumns: `${LABEL_W}px minmax(0,1fr) ${VALUE_W}px`,
    columnGap: `${GAP}px`,
  };

  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-tertiary">
        No friction recorded in this period.
      </p>
    );
  }

  return (
    <>
      <div className="px-5 py-5">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-7"
            style={{ left: LABEL_W + GAP, right: VALUE_W + GAP }}
          >
            <div className="flex h-full justify-between">
              {ticks.map((tick, index) => (
                <span
                  key={tick}
                  className={
                    index === 0
                      ? "w-px bg-[var(--border-primary)]"
                      : "w-px bg-[var(--border-secondary)]"
                  }
                />
              ))}
            </div>
          </div>

          <ol className="grid items-center gap-y-3" style={grid}>
            {rows.map((row) => {
              const answered = row.sessions - row.uncoveredSessions;
              return (
                <li key={row.topic} className="contents">
                  <span className="truncate text-[12px] text-tertiary">
                    {row.label}
                  </span>

                  <span
                    role="img"
                    aria-label={`${row.label}: ${formatCount(row.sessions)} times, of which ${formatCount(row.uncoveredSessions)} have no answer on the page.`}
                    className="flex h-4 items-stretch"
                    style={{ width: `${(row.sessions / max) * 100}%` }}
                  >
                    {answered > 0 && (
                      <span
                        className="rounded-l-[3px] bg-[var(--chart-positive)]"
                        style={{ width: `${(answered / row.sessions) * 100}%` }}
                      />
                    )}
                    {row.uncoveredSessions > 0 && (
                      <span
                        className="flex-1 bg-[var(--chart-negative)]"
                        style={{
                          borderTopRightRadius: 3,
                          borderBottomRightRadius: 3,
                          borderTopLeftRadius: answered > 0 ? 0 : 3,
                          borderBottomLeftRadius: answered > 0 ? 0 : 3,
                        }}
                      />
                    )}
                  </span>

                  <span className="text-right text-[12px] font-medium text-primary tabular-nums">
                    {formatCount(row.sessions)}
                  </span>
                </li>
              );
            })}

            <li className="contents" aria-hidden>
              <span />
              <span className="mt-2 flex justify-between">
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="-translate-x-1/2 text-[10px] text-quaternary tabular-nums first:translate-x-0 last:-translate-x-full"
                  >
                    {tick >= 1000 ? `${tick / 1000}k` : tick}
                  </span>
                ))}
              </span>
              <span />
            </li>
          </ol>
        </div>
      </div>

      <footer className="flex items-center gap-4 border-t border-secondary px-5 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <span className="size-2 rounded-[2px] bg-[var(--chart-positive)]" />
          Answered by your pages
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <span className="size-2 rounded-[2px] bg-[var(--chart-negative)]" />
          Nothing on the page
        </span>
      </footer>
    </>
  );
}
