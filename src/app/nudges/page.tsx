"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { IntentPanel } from "@/components/app/intent-panel";
import { NudgePanel } from "@/components/app/nudge-panel";
import { Badge } from "@/components/base/badge";
import { ButtonGroup } from "@/components/base/button-group";
import { Card, CardHeader } from "@/components/base/card";
import { StatBand } from "@/components/base/stat-band";
import { InfoTip } from "@/components/base/info-tip";
import { Table, Td, Th, Tr } from "@/components/base/table";
import { cx } from "@/lib/cx";
import {
  FIRINGS,
  type IntentKey,
  INTENT_PERFORMANCE,
  INTENTS_BY_WORTH,
  leftUnsettled,
  INTENTS,
  resolutionOf,
  NUDGE_TOTALS,
  SUPPRESSION_REASONS,
  SUPPRESSION_TOTAL,
} from "@/lib/nudge-data";
import { formatCurrency, METRIC_NOTES, STORE } from "@/lib/merchant-data";
import { ARMS, formatShare } from "@/lib/overview-data";

type Filter = "all" | "resolved" | "unresolved";
/** The two ways of reading the same firings: grouped by question, or one by one. */
type View = "questions" | "recent";

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default function NudgesPage() {
  const [view, setView] = useState<View>("questions");
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

      {/*
        Add to cart against the held-back group leads, because it is the only
        figure on this page that answers the objection a merchant will
        actually raise: that a shopper who saw a card and bought would very
        often have bought anyway. Settle rate, volume and dismissals qualify
        it, so they sit beside it rather than competing as equal cards.
      */}
      <StatBand
        label="Added to cart"
        info={{
          label: "Counted how",
          body: "Add-to-cart among shoppers who saw a card, against the shoppers Cue was deliberately held back from. Every other figure on this page describes what Cue did; only this one describes what changed because of it.",
        }}
        value={formatShare(ARMS.addedToCartNudged)}
        change={{
          value: formatShare(
            ARMS.addedToCartNudged / ARMS.addedToCartHoldout - 1,
          ),
          direction: "up",
          comparison: "against holdout",
        }}
        caption={`${formatShare(ARMS.addedToCartHoldout)} among the shoppers Cue was held back from`}
        stats={[
          {
            label: "Questions settled",
            value: pct(totalResolved, NUDGE_TOTALS.shown),
          },
          {
            label: "Times Cue spoke",
            value: NUDGE_TOTALS.shown.toLocaleString(),
          },
          {
            label: "Held back",
            value: pct(
              SUPPRESSION_TOTAL,
              SUPPRESSION_TOTAL + NUDGE_TOTALS.shown,
            ),
          },
          {
            label: "Dismissed",
            value: pct(NUDGE_TOTALS.dismissed, NUDGE_TOTALS.shown),
          },
        ]}
      />

      {/*
        Ranked by what settling each question is worth, not by a fixed
        taxonomy order. A list that never reorders is a configuration screen;
        the ranking is what makes this a finding — it is the intents doc's own
        "rank by what each confusion costs" argument, produced from data.

        Example copy is deliberately not a column: there is one sample line
        per question, identical across every product and wording variant, and
        as a column it reads as the live copy. It lives in the panel instead,
        labelled as an example.
      */}
      <Card>
        <CardHeader
          title={view === "questions" ? "What Cue answers" : "Recent nudges"}
          description={
            view === "questions"
              ? "Six kinds of question, ranked by what settling them is worth. The ones near the bottom are the ones to reconsider."
              : `${rows.length} of ${FIRINGS.length} shown · select one to see why it fired`
          }
          actions={
            <div className="flex items-center gap-5">
              <ButtonGroup<View>
                value={view}
                onChange={setView}
                options={[
                  { value: "questions", label: "By question", count: 6 },
                  {
                    value: "recent",
                    label: "Every nudge",
                    count: FIRINGS.length,
                  },
                ]}
              />
              {view === "recent" && (
                <div className="border-l border-secondary pl-5">
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
                </div>
              )}
            </div>
          }
        />
        {view === "questions" && (
          <Table>
            <thead>
              <tr>
                <Th className="w-[38%]">Question</Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1.5">
                    Worth settling
                    <InfoTip
                      label={METRIC_NOTES.intentWorth.label}
                      align="right"
                    >
                      {METRIC_NOTES.intentWorth.body}
                    </InfoTip>
                  </span>
                </Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1.5">
                    Cart lift
                    <InfoTip label="Counted how" align="right">
                      Add-to-cart for shoppers who saw this answer, against the
                      shoppers Cue was deliberately held back from. The only
                      figure here that is not vulnerable to the objection that
                      they would have bought anyway.
                    </InfoTip>
                  </span>
                </Th>
                <Th className="text-right">Shown</Th>
                <Th className="text-right">Settled it</Th>
                <Th className="text-right">Left unsettled</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {INTENTS_BY_WORTH.map((perf) => {
                const intent = INTENTS[perf.intent];
                const settledShare =
                  perf.shown === 0 ? 0 : perf.resolved / perf.shown;
                const unsettled = leftUnsettled(perf);

                return (
                  <Tr
                    key={perf.intent}
                    onClick={() => setSelectedIntent(perf.intent)}
                    selected={perf.intent === selectedIntent}
                  >
                    <Td>
                      <p className="text-[13px] font-medium text-primary">
                        {intent.question}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-tertiary">
                        {intent.behaviour}
                      </p>
                    </Td>
                    <Td className="text-right align-middle font-medium text-primary tabular-nums">
                      {formatCurrency(perf.worth)}
                    </Td>
                    <Td className="text-right align-middle">
                      <span
                        className={cx(
                          "font-medium tabular-nums",
                          perf.cartLift > 0.05
                            ? "text-success-primary"
                            : "text-error-primary",
                        )}
                      >
                        {perf.cartLift > 0 ? "+" : ""}
                        {Math.round(perf.cartLift * 100)}%
                      </span>
                      {perf.cartLift <= 0.05 && (
                        <p className="mt-0.5 text-[11px] text-quaternary">
                          {perf.cartLift < 0
                            ? "costing sales"
                            : "barely moving"}
                        </p>
                      )}
                    </Td>
                    <Td className="text-right align-middle text-secondary tabular-nums">
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
                      <p className="font-medium text-primary tabular-nums">
                        {unsettled === 0 ? "—" : unsettled.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] text-quaternary">
                        still hesitating
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
        )}
        {view === "recent" && (
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
        )}
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
