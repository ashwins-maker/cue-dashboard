"use client";

import {
  ArrowUpRight,
  BellOff,
  Check,
  ExternalLink,
  Quote,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { Badge, type BadgeColor } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { InfoTip } from "@/components/base/info-tip";
import { cx } from "@/lib/cx";
import {
  CONTENT_LABEL,
  type ContentState,
  formatCurrency,
  formatPercent,
  type FrictionPoint,
  METRIC_NOTES,
  revenueAtRisk,
  SOURCE_DESCRIPTION,
  SOURCE_LABEL,
  TOPIC_LABEL,
} from "@/lib/merchant-data";

const CONTENT_COLOR: Record<ContentState, BadgeColor> = {
  covered: "success",
  low_confidence: "warning",
  uncovered: "error",
};

export function FrictionPanel({
  point,
  onClose,
}: {
  point: FrictionPoint | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!point) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [point, onClose]);

  if (!point) return null;

  const uncovered = point.contentState === "uncovered";
  const belowBaseline = point.conversion < point.baseline;
  const shortfall = point.baseline - point.conversion;

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
        aria-label={point.summary}
        className="relative flex h-full w-full max-w-[520px] flex-col border-l border-primary bg-secondary shadow-lg-dark"
      >
        {/* Header */}
        <header className="flex items-start gap-4 border-b border-secondary px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={CONTENT_COLOR[point.contentState]} dot>
                {CONTENT_LABEL[point.contentState]}
              </Badge>
              <Badge color="gray">{TOPIC_LABEL[point.topic]}</Badge>
            </div>
            <h2 className="mt-2.5 text-base leading-snug font-semibold text-primary">
              {point.summary}
            </h2>
            <p className="mt-1 text-[13px] text-tertiary">
              {point.productTitle} · ${point.productPrice}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 cursor-pointer rounded-lg p-1.5 text-tertiary transition-colors hover:bg-tertiary hover:text-primary"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Numbers */}
          <section className="grid grid-cols-2 gap-px border-b border-secondary bg-[var(--border-secondary)]">
            <Figure
              label="Sessions"
              value={point.sessions.toLocaleString()}
              sub={point.trend.value}
              subTone={point.trend.direction === "down" ? "good" : "bad"}
              info={METRIC_NOTES.sessions}
            />
            <Figure
              label="Revenue at risk"
              value={formatCurrency(revenueAtRisk(point))}
              sub={`${formatPercent(Math.max(shortfall, 0))} below comparable`}
              info={METRIC_NOTES.revenueAtRisk}
            />
            <Figure
              label="Conversion"
              value={formatPercent(point.conversion)}
              sub={`vs ${formatPercent(point.baseline)} comparable`}
              subTone={belowBaseline ? "bad" : "good"}
              info={METRIC_NOTES.conversionComparison}
            />
            <Figure
              label="Return rate"
              value={
                point.returnRate === null
                  ? "Pending"
                  : formatPercent(point.returnRate)
              }
              sub={
                point.returnRate === null
                  ? "No orders yet this period"
                  : "Whole product, not just this point"
              }
              subTone={
                point.returnRate !== null && point.returnRate > 0.1
                  ? "bad"
                  : undefined
              }
              info={METRIC_NOTES.returnRate}
            />
          </section>

          {/* How we know */}
          <Section title="How we know">
            <div className="flex items-start gap-3">
              <Badge color={point.verbatim ? "brand" : "gray"}>
                {SOURCE_LABEL[point.source]}
              </Badge>
              <p className="flex-1 text-[13px] leading-relaxed text-secondary">
                {SOURCE_DESCRIPTION[point.source]}
              </p>
            </div>

            {point.verbatim && (
              <ul className="mt-3 space-y-1.5">
                {point.verbatim.map((phrase) => (
                  <li
                    key={phrase}
                    className="flex items-start gap-2 rounded-lg bg-primary-alt px-3 py-2"
                  >
                    <Quote
                      className="mt-0.5 size-3 shrink-0 text-quaternary"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="text-[13px] text-secondary">{phrase}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* What the widget serves */}
          <Section
            title={uncovered ? "What the widget serves" : "Current answer"}
          >
            {point.answer ? (
              <>
                <blockquote className="border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-primary">
                  {point.answer}
                </blockquote>
                <p className="mt-2 text-[11px] text-quaternary">
                  Built from {point.evidence}
                </p>
                {point.contentState === "low_confidence" && (
                  <p className="mt-3 rounded-lg bg-[var(--utility-warning-50)] px-3 py-2 text-[12px] leading-relaxed text-[var(--utility-warning-700)]">
                    The source material is thin, so the answer hedges. Adding
                    store content here would let it state something definite.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-tertiary">
                Nothing. The widget stays silent because the store holds no
                content that answers this.
              </p>
            )}
          </Section>

          {/* Recommendation */}
          <Section title="Recommended change">
            <div
              className={cx(
                "flex items-start gap-2.5 rounded-xl border px-3.5 py-3",
                uncovered
                  ? "border-error bg-[var(--utility-error-50)]"
                  : "border-secondary bg-primary-alt",
              )}
            >
              {uncovered ? (
                <TriangleAlert
                  className="mt-0.5 size-3.5 shrink-0 text-error-primary"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-success-primary"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              <p className="text-[13px] leading-relaxed text-secondary">
                {point.recommendation}
              </p>
            </div>
          </Section>
        </div>

        {/* Actions */}
        <footer className="flex flex-wrap items-center gap-2 border-t border-secondary px-6 py-4">
          {uncovered ? (
            <>
              <Button
                hierarchy="primary"
                size="sm"
                iconTrailing={
                  <ArrowUpRight className="size-3.5" strokeWidth={2} />
                }
              >
                Add content in Shopify
              </Button>
              <Button
                hierarchy="secondary"
                size="sm"
                iconLeading={<BellOff className="size-3.5" strokeWidth={2} />}
              >
                Mute this topic
              </Button>
            </>
          ) : (
            <>
              <Button
                hierarchy="primary"
                size="sm"
                iconLeading={<Check className="size-3.5" strokeWidth={2} />}
              >
                Promote to page copy
              </Button>
              <Button
                hierarchy="secondary"
                size="sm"
                iconLeading={
                  <ExternalLink className="size-3.5" strokeWidth={2} />
                }
              >
                View source
              </Button>
            </>
          )}
          <span className="ml-auto text-[11px] text-quaternary">
            {uncovered
              ? "Adding content retires this friction point."
              : "Promoting retires the answer from the widget."}
          </span>
        </footer>
      </aside>
    </div>
  );
}

function Section({
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

function Figure({
  label,
  value,
  sub,
  subTone,
  info,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "good" | "bad";
  info: { label: string; body: string };
}) {
  return (
    <div className="bg-secondary px-6 py-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-tertiary">
        {label}
        <InfoTip label={info.label}>{info.body}</InfoTip>
      </p>
      <p className="mt-1.5 text-xl leading-none font-semibold text-primary tabular-nums">
        {value}
      </p>
      {sub && (
        <p
          className={cx(
            "mt-1.5 text-[11px] tabular-nums",
            subTone === "good"
              ? "text-success-primary"
              : subTone === "bad"
                ? "text-error-primary"
                : "text-quaternary",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
