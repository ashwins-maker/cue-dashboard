"use client";

import { Check, LogOut, X } from "lucide-react";
import { useEffect } from "react";
import { Badge, type BadgeColor } from "@/components/base/badge";
import { cx } from "@/lib/cx";
import {
  INTENTS,
  type NudgeFiring,
  type Resolution,
  resolutionOf,
} from "@/lib/nudge-data";

const RESOLUTION: Record<Resolution, { label: string; color: BadgeColor }> = {
  resolved: { label: "Resolved", color: "success" },
  unresolved: { label: "Not resolved", color: "error" },
  exited: { label: "Left the page", color: "error" },
  pending: { label: "No resolution event", color: "gray" },
};

/**
 * Every field rendered here is a real column on `nudge_shown_log` or a key
 * that `nudge-shown-log-repo.ts` merges into its `outcome` JSONB. An absent
 * field renders as "not recorded" rather than a zero — the JSONB is merged
 * incrementally, so a missing key means the event never arrived, which is not
 * the same as the event arriving with a falsy value.
 */
export function NudgePanel({
  firing,
  onClose,
}: {
  firing: NudgeFiring | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!firing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [firing, onClose]);

  if (!firing) return null;

  const intent = INTENTS[firing.intent];
  const { state, evidence } = resolutionOf(firing);
  const resolution = RESOLUTION[state];
  const post = firing.outcome.postNudge;

  return (
    <Drawer label={`${intent.label} nudge`} onClose={onClose}>
      <header className="flex items-start gap-4 border-b border-secondary px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="brand">{intent.label}</Badge>
            <Badge color={resolution.color} dot>
              {resolution.label}
            </Badge>
          </div>
          <h2 className="mt-2.5 text-base leading-snug font-semibold text-primary">
            {intent.question}
          </h2>
          <p className="mt-1 text-[13px] text-tertiary">
            {firing.productTitle}
            <span className="text-quaternary"> · {firing.shownAt}</span>
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </header>

      <div className="flex-1 overflow-y-auto">
        <Section title="Why it fired">
          <ul className="space-y-1.5">
            {firing.triggeringSignals.map((signal) => (
              <li
                key={signal}
                className="flex items-center gap-2 rounded-lg bg-primary-alt px-3 py-2"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-brand-400" />
                <code className="font-mono text-[12px] text-secondary">
                  {signal}
                </code>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[11px] leading-relaxed text-quaternary">
            From <code className="font-mono">triggering_signals</code>, written
            onto the row at impression.
          </p>
        </Section>

        <Section title="What it said">
          <blockquote className="border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-primary">
            {firing.contentText}
          </blockquote>
          <dl className="mt-3 space-y-1">
            <Field label="card_type" value={firing.cardType} />
            <Field label="variant_label" value={firing.variantLabel} />
            <Field label="segment_key" value={firing.segmentKey} />
          </dl>
        </Section>

        <Section title="Nudge lifecycle">
          <div className="grid grid-cols-2 gap-px bg-[var(--border-secondary)]">
            <Stat
              label="Seen on screen"
              value={firing.outcome.impression ? "Yes" : "Not recorded"}
              tone={firing.outcome.impression ? "good" : undefined}
            />
            <Stat
              label="Time visible"
              value={seconds(firing.outcome.timeVisibleMs)}
            />
            <Stat label="Read time" value={seconds(firing.outcome.readTimeMs)} />
            <Stat
              label="Action used"
              value={
                firing.outcome.actionClicked
                  ? (firing.outcome.actionId ?? "Yes")
                  : "No"
              }
              tone={firing.outcome.actionClicked ? "good" : undefined}
            />
            <Stat
              label="Dismissed"
              value={
                firing.outcome.dismissed
                  ? (firing.outcome.dismissMethod ?? "Yes")
                  : "No"
              }
              tone={firing.outcome.dismissed ? "bad" : undefined}
            />
            <Stat
              label="Ignored"
              value={firing.outcome.ignored ? "Yes" : "No"}
              tone={firing.outcome.ignored ? "bad" : undefined}
            />
          </div>
          {firing.outcome.keyboardUsed && (
            <p className="mt-3 text-[12px] text-tertiary">
              Reached and operated by keyboard.
            </p>
          )}
        </Section>

        <Section title="Did it land">
          <p className="text-[11px] text-quaternary">
            This intent resolves when: {intent.winsWhen.toLowerCase()}
          </p>
          <div
            className={cx(
              "mt-2.5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3",
              state === "resolved"
                ? "border-secondary bg-[var(--utility-success-50)]"
                : state === "pending"
                  ? "border-secondary bg-primary-alt"
                  : "border-error bg-[var(--utility-error-50)]",
            )}
          >
            {state === "resolved" ? (
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-success-primary"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <LogOut
                className="mt-0.5 size-3.5 shrink-0 text-error-primary"
                strokeWidth={2}
                aria-hidden
              />
            )}
            <p className="text-[13px] leading-relaxed text-secondary">
              {evidence}
            </p>
          </div>

          {post && (
            <dl className="mt-3 space-y-1">
              {post.variantChangeCountBefore !== undefined && (
                <Field
                  label="variantChangeCountBefore"
                  value={String(post.variantChangeCountBefore)}
                />
              )}
              {post.variantChangeCountAfter !== undefined && (
                <Field
                  label="variantChangeCountAfter"
                  value={String(post.variantChangeCountAfter)}
                />
              )}
              {post.sizeGuideReopened !== undefined && (
                <Field
                  label="sizeGuideReopened"
                  value={String(post.sizeGuideReopened)}
                />
              )}
              {post.policyNavAgain !== undefined && (
                <Field
                  label="policyNavAgain"
                  value={String(post.policyNavAgain)}
                />
              )}
              {post.msToAddToCart !== undefined && (
                <Field label="msToAddToCart" value={String(post.msToAddToCart)} />
              )}
              {post.exitedAfter !== undefined && (
                <Field label="exitedAfter" value={String(post.exitedAfter)} />
              )}
            </dl>
          )}

          <div className="mt-3 rounded-lg bg-primary-alt px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-tertiary">
                outcome.conversion
              </span>
              <span className="ml-auto text-[12px] text-quaternary">
                Not written
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-quaternary">
              add_to_cart is emitted but carries no nudgeShownLogId, and
              order_completed is not emitted, so nothing fills this key.
            </p>
          </div>
        </Section>

        <Section title="What would have stopped it">
          {intent.silenceRules.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-tertiary">
              Nothing. No suppression rule covers this intent, so it fires
              whenever one of its rules matches.
            </p>
          ) : (
            <>
              <ul className="flex flex-wrap gap-1.5">
                {intent.silenceRules.map((rule) => (
                  <li key={rule}>
                    <Badge color="gray">
                      <code className="font-mono text-[11px]">{rule}</code>
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11px] leading-relaxed text-quaternary">
                None matched this session, so nothing vetoed the card.
              </p>
            </>
          )}
        </Section>
      </div>

      <footer className="flex items-center gap-2 border-t border-secondary px-6 py-4">
        <span className="font-mono text-[11px] text-quaternary">
          {firing.sessionId} · {firing.id}
        </span>
        <span className="ml-auto text-[11px] text-quaternary">
          Anonymous, visit-scoped
        </span>
      </footer>
    </Drawer>
  );
}

/* --------------------------------------------------- shared drawer pieces */

export function Drawer({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex h-full w-full max-w-[520px] flex-col border-l border-primary bg-secondary shadow-lg-dark"
      >
        {children}
      </aside>
    </div>
  );
}

export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="-mr-1 cursor-pointer rounded-lg p-1.5 text-tertiary transition-colors hover:bg-tertiary hover:text-primary"
    >
      <X className="size-4" strokeWidth={2} aria-hidden />
    </button>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-secondary px-6 py-5">
      <h3 className="text-[11px] font-medium tracking-wide text-quaternary uppercase">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="font-mono text-[11px] text-quaternary">{label}</dt>
      <dd className="ml-auto font-mono text-[11px] text-secondary">{value}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="bg-secondary px-4 py-3">
      <p className="text-[11px] font-medium text-tertiary">{label}</p>
      <p
        className={cx(
          "mt-1 text-[13px] font-semibold",
          tone === "good"
            ? "text-success-primary"
            : tone === "bad"
              ? "text-error-primary"
              : "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function seconds(ms: number | undefined): string {
  if (ms === undefined) return "Not recorded";
  return `${(ms / 1000).toFixed(1)}s`;
}
