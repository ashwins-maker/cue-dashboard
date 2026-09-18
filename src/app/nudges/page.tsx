"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { IntentPanel } from "@/components/app/intent-panel";
import { NudgePanel } from "@/components/app/nudge-panel";
import { Badge } from "@/components/base/badge";
import { ButtonGroup } from "@/components/base/button-group";
import { Card, CardHeader } from "@/components/base/card";
import { MetricCard } from "@/components/base/metric-card";
import { NotWired } from "@/components/base/not-wired";
import { Table, Td, Th, Tr } from "@/components/base/table";
import { cx } from "@/lib/cx";
import {
  FIRINGS,
  type IntentKey,
  INTENT_ORDER,
  INTENT_PERFORMANCE,
  INTENTS,
  resolutionOf,
  NUDGE_TOTALS,
  SUPPRESSION_REASONS,
  SUPPRESSION_TOTAL,
} from "@/lib/nudge-data";
import { STORE } from "@/lib/merchant-data";

type Filter = "all" | "resolved" | "unresolved";

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default function NudgesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<IntentKey | null>(null);

  const rows = useMemo(() => {
    if (filter === "resolved")
      return FIRINGS.filter((f) => resolutionOf(f).state === "resolved");
    if (filter === "unresolved")
      return FIRINGS.filter((f) =>
        ["unresolved", "exited"].includes(resolutionOf(f).state),
      );
    return FIRINGS;
  }, [filter]);

  const resolvedCount = FIRINGS.filter(
    (f) => resolutionOf(f).state === "resolved",
  ).length;

  const selected = FIRINGS.find((f) => f.id === selectedId) ?? null;

  const totalResolved = INTENT_PERFORMANCE.reduce(
    (sum, row) => sum + row.resolved,
    0,
  );

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-primary">
          Nudges
        </h1>
        <p className="mt-1 text-[13px] text-tertiary">
          Every time Cue spoke, what set it off, and whether the shopper stopped
          being stuck afterwards. {STORE.period}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Nudges shown"
          value={NUDGE_TOTALS.shown.toLocaleString()}
          hint="Confirmed visible on screen, not merely rendered."
        />
        <MetricCard
          label="Shoppers who engaged"
          value={pct(NUDGE_TOTALS.engaged, NUDGE_TOTALS.shown)}
          hint={`${NUDGE_TOTALS.engaged.toLocaleString()} expanded it or used its action.`}
        />
        <MetricCard
          label="Stopped being stuck"
          value={pct(totalResolved, NUDGE_TOTALS.shown)}
          emphasis
          hint="The behaviour that triggered the nudge stopped afterwards."
        />
        <MetricCard
          label="Times it stayed quiet"
          value={SUPPRESSION_TOTAL.toLocaleString()}
          hint="Cue could have spoken and chose not to. Every one is logged with a reason."
        />
      </div>

      {/* What shoppers are unsure about — the six intents, in merchant words */}
      <Card>
        <CardHeader
          title="What shoppers are unsure about"
          description="Six things Cue watches for. Whether answering each one settles it is the only measure that matters."
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-[30%]">Question</Th>
              <Th className="w-[28%]">An answer Cue gives</Th>
              <Th className="text-right">Shown</Th>
              <Th className="text-right">Settled it</Th>
              <Th className="text-right">Held back</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {INTENT_ORDER.map((key) => {
              const intent = INTENTS[key];
              const perf = INTENT_PERFORMANCE.find((p) => p.intent === key)!;
              const settledShare = perf.shown === 0 ? 0 : perf.resolved / perf.shown;

              return (
                <Tr
                  key={key}
                  onClick={() => setSelectedIntent(key)}
                  selected={key === selectedIntent}
                >
                  <Td>
                    <p className="text-[13px] font-medium text-primary">
                      {intent.question}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-tertiary">
                      {intent.behaviour}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-[13px] leading-relaxed text-secondary">
                      {intent.example}
                    </p>
                    {intent.action && (
                      <p className="mt-1 text-[11px] text-quaternary">
                        with a link to {intent.action.toLowerCase()}
                      </p>
                    )}
                  </Td>
                  <Td className="text-right align-middle font-medium text-primary tabular-nums">
                    {perf.shown === 0 ? "—" : perf.shown.toLocaleString()}
                  </Td>
                  <Td className="align-middle">
                    {perf.shown === 0 ? (
                      <p className="text-right text-quaternary">—</p>
                    ) : (
                      <>
                        <p
                          className={cx(
                            "text-right font-medium tabular-nums",
                            settledShare > 0.5
                              ? "text-success-primary"
                              : "text-error-primary",
                          )}
                        >
                          {pct(perf.resolved, perf.shown)}
                        </p>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-quaternary">
                          <div
                            className={cx(
                              "h-full rounded-full",
                              settledShare > 0.5
                                ? "bg-success-500"
                                : "bg-error-500",
                            )}
                            style={{ width: `${settledShare * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </Td>
                  <Td className="text-right align-middle">
                    <p className="text-secondary tabular-nums">
                      {perf.suppressed === 0
                        ? "—"
                        : perf.suppressed.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[11px] text-quaternary">
                      {intent.silenceRules.length === 0
                        ? "no hold-back rule"
                        : `${intent.silenceRules.length} rule${intent.silenceRules.length === 1 ? "" : "s"}`}
                    </p>
                  </Td>
                  <Td className="text-right align-middle">
                    <ChevronRight
                      className="inline size-4 text-quaternary"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* Live feed */}
      <Card>
        <CardHeader
          title="Recent nudges"
          description={`${rows.length} of ${FIRINGS.length} shown · select one to see why it fired`}
          actions={
            <ButtonGroup<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: FIRINGS.length },
                {
                  value: "resolved",
                  label: "Worked",
                  count: resolvedCount,
                },
                {
                  value: "unresolved",
                  label: "Didn't",
                  count: FIRINGS.length - resolvedCount,
                },
              ]}
            />
          }
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-[38%]">What it said</Th>
              <Th>Intent</Th>
              <Th>Set off by</Th>
              <Th className="text-right">Visible</Th>
              <Th>Outcome</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((firing) => {
              const intent = INTENTS[firing.intent];
              const { state } = resolutionOf(firing);
              const good = state === "resolved";
              const pending = state === "pending";

              return (
                <Tr
                  key={firing.id}
                  onClick={() => setSelectedId(firing.id)}
                  selected={firing.id === selectedId}
                >
                  <Td className="align-middle">
                    <p className="text-[13px] text-primary">
                      {firing.contentText}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-tertiary">
                      {firing.productTitle}
                      <NotWired field="product" />
                      <span className="text-quaternary">
                        · {firing.shownAt}
                      </span>
                    </p>
                  </Td>
                  <Td className="align-middle">
                    <Badge color="brand">{intent.label}</Badge>
                  </Td>
                  <Td className="align-middle">
                    <code className="font-mono text-[11px] text-tertiary">
                      {firing.triggeringSignals[0]}
                    </code>
                    {firing.triggeringSignals.length > 1 && (
                      <span className="ml-1 text-[11px] text-quaternary">
                        +{firing.triggeringSignals.length - 1}
                      </span>
                    )}
                  </Td>
                  <Td className="text-right align-middle text-secondary tabular-nums">
                    {firing.outcome.timeVisibleMs === undefined
                      ? "—"
                      : `${(firing.outcome.timeVisibleMs / 1000).toFixed(1)}s`}
                  </Td>
                  <Td className="align-middle">
                    <Badge
                      color={pending ? "gray" : good ? "success" : "error"}
                      dot
                    >
                      {pending
                        ? "Measuring"
                        : good
                          ? "Stopped being stuck"
                          : "Still stuck"}
                    </Badge>
                  </Td>
                  <Td className="text-right align-middle">
                    <ChevronRight
                      className="inline size-4 text-quaternary"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* Restraint */}
      <Card>
        <CardHeader
          title="When it stayed quiet"
          description="Cue speaks once per visit at most, and only when it has something useful to say. Every decision not to speak is recorded."
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-[30%]">Reason</Th>
              <Th className="w-[40%]">What it means</Th>
              <Th className="text-right">Sessions</Th>
              <Th className="text-right">Share</Th>
            </tr>
          </thead>
          <tbody>
            {SUPPRESSION_REASONS.map((reason) => (
              <Tr key={reason.rule}>
                <Td>
                  <p className="text-[13px] font-medium text-primary">
                    {reason.label}
                  </p>
                  <code className="mt-0.5 block font-mono text-[11px] text-quaternary">
                    {reason.rule}
                  </code>
                </Td>
                <Td className="text-[13px] leading-relaxed text-secondary">
                  {reason.explanation}
                </Td>
                <Td className="text-right font-medium text-primary tabular-nums">
                  {reason.count.toLocaleString()}
                </Td>
                <Td className="text-right text-secondary tabular-nums">
                  {pct(reason.count, SUPPRESSION_TOTAL)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <NudgePanel firing={selected} onClose={() => setSelectedId(null)} />

      <IntentPanel
        intent={selectedIntent ? INTENTS[selectedIntent] : null}
        performance={
          INTENT_PERFORMANCE.find((p) => p.intent === selectedIntent) ?? null
        }
        onClose={() => setSelectedIntent(null)}
      />
    </div>
  );
}
