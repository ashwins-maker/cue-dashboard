"use client";

import { useEffect } from "react";
import { CloseButton, Drawer, Section } from "@/components/app/nudge-panel";
import { Badge } from "@/components/base/badge";
import {
  FIRINGS,
  type Intent,
  type IntentPerformance,
  resolutionOf,
} from "@/lib/nudge-data";

/**
 * Shows only what the backend actually holds for an intent:
 *  - its rows in `nudge_rules` (signal → card_type, plus the conditions gate)
 *  - its rows in `suppression_rules`
 *  - counts rolled up from `nudge_shown_log` and `suppression_log`
 *
 * "Intent" itself is this dashboard's grouping — the backend routes a signal
 * straight to a card type and has no intent concept — so that is stated rather
 * than implied.
 */
export function IntentPanel({
  intent,
  performance,
  onClose,
}: {
  intent: Intent | null;
  performance: IntentPerformance | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!intent) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [intent, onClose]);

  if (!intent || !performance) return null;

  const recent = FIRINGS.filter((f) => f.intent === intent.key);
  const cardTypes = [...new Set(intent.rules.map((rule) => rule.cardType))];

  return (
    <Drawer label={intent.label} onClose={onClose}>
      <header className="flex items-start gap-4 border-b border-secondary px-6 py-5">
        <div className="min-w-0 flex-1">
          <Badge color="brand">{intent.label}</Badge>
          <h2 className="mt-2.5 text-base leading-snug font-semibold text-primary">
            {intent.question}
          </h2>
          <p className="mt-1 text-[13px] text-tertiary">
            Resolves when {intent.winsWhen.toLowerCase()}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </header>

      <div className="flex-1 overflow-y-auto">
        <section className="grid grid-cols-2 gap-px border-b border-secondary bg-[var(--border-secondary)]">
          <Figure
            label="Shown"
            value={performance.shown.toLocaleString()}
            sub="rows in nudge_shown_log"
          />
          <Figure
            label="Stayed quiet"
            value={performance.suppressed.toLocaleString()}
            sub="rows in suppression_log"
          />
          <Figure
            label="Engaged"
            value={pct(performance.engaged, performance.shown)}
            sub="expanded or used the action"
          />
          <Figure
            label="Stopped being stuck"
            value={pct(performance.resolved, performance.shown)}
            sub="from the post_nudge_* events"
          />
        </section>

        <Section title="What Cue says">
          <blockquote className="border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-primary">
            {intent.example}
          </blockquote>
          {intent.action && (
            <p className="mt-2 text-[11px] text-quaternary">
              With a link to {intent.action.toLowerCase()}. Cue states the fact
              and never tells the shopper what to choose.
            </p>
          )}
        </Section>

        <Section title="When Cue holds back">
          <p className="text-[13px] leading-relaxed text-secondary">
            {intent.quietWhen}
          </p>
          {intent.silenceRules.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {intent.silenceRules.map((rule) => (
                <li key={rule}>
                  <Badge color="gray">
                    <code className="font-mono text-[11px]">{rule}</code>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="What sets it off">
          <p className="text-[13px] leading-relaxed text-secondary">
            {intent.behaviour}.
          </p>
        </Section>

        <details className="border-b border-secondary px-6 py-4">
          <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-quaternary uppercase">
            Rules behind it
          </summary>
          <div className="mt-3">
          <ul className="space-y-2">
            {intent.rules.map((rule) => (
              <li
                key={`${rule.signal}-${rule.cardType}-${rule.condition ?? ""}`}
                className="rounded-lg bg-primary-alt px-3 py-2.5"
              >
                <p className="font-mono text-[12px] text-secondary">
                  {rule.signal}{" "}
                  <span className="text-quaternary">→ {rule.cardType}</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-quaternary">
                  {rule.condition ?? "No condition — fires on the signal alone"}
                </p>
              </li>
            ))}
          </ul>
            <p className="mt-2.5 text-[11px] leading-relaxed text-quaternary">
              Seeded rows in <code className="font-mono">nudge_rules</code>. Any
              of them can be switched off.
            </p>
          </div>
        </details>

        <Section title="Cards it can serve">
          <ul className="flex flex-wrap gap-1.5">
            {cardTypes.map((cardType) => (
              <li key={cardType}>
                <Badge color="gray">
                  <code className="font-mono text-[11px]">{cardType}</code>
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[11px] leading-relaxed text-quaternary">
            Copy comes from <code className="font-mono">card_content</code>,
            generated offline per product. The bandit picks which wording.
          </p>
        </Section>

        <Section title="Recent">
          {recent.length === 0 ? (
            <p className="text-[13px] text-tertiary">
              Nothing in the current window.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((firing) => {
                const { state } = resolutionOf(firing);
                return (
                  <li
                    key={firing.id}
                    className="rounded-lg bg-primary-alt px-3 py-2.5"
                  >
                    <p className="text-[13px] leading-relaxed text-primary">
                      {firing.contentText}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-[11px] text-quaternary">
                      <code className="font-mono">
                        {firing.triggeringSignals[0]}
                      </code>
                      <span>·</span>
                      <span>{firing.shownAt}</span>
                      <span className="ml-auto">{state}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <footer className="flex items-center gap-1.5 border-t border-secondary px-6 py-4">
        <span className="text-[11px] text-quaternary">
          Intent is a dashboard grouping
        </span>
        <span className="ml-auto text-[11px] text-quaternary">
          {intent.rules.length} rule
          {intent.rules.length === 1 ? "" : "s"}
        </span>
      </footer>
    </Drawer>
  );
}

function Figure({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-secondary px-6 py-4">
      <p className="text-[11px] font-medium text-tertiary">{label}</p>
      <p className="mt-1.5 text-xl leading-none font-semibold text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[11px] text-quaternary">{sub}</p>
    </div>
  );
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}
