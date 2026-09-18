"use client";

import { Check, ExternalLink, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { Toggle } from "@/components/base/toggle";
import { cx } from "@/lib/cx";
import { COVERAGE, STORE, TOPIC_LABEL } from "@/lib/merchant-data";

export default function SettingsPage() {
  const [muted, setMuted] = useState<string[]>([]);
  const [confirmingOff, setConfirmingOff] = useState(false);

  const toggleTopic = (topic: string, on: boolean) =>
    setMuted((current) =>
      on ? current.filter((t) => t !== topic) : [...current, topic],
    );

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-primary">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-tertiary">
          {STORE.name} · {STORE.domain}
        </p>
      </div>

      {/* Store connection — first thing a merchant checks when something looks wrong */}
      <Card>
        <CardHeader
          title="Store connection"
          description="Cue reads your catalog, policies and reviews. It never writes to your store."
        />
        <dl className="divide-y divide-[var(--border-secondary)]">
          <Row label="Shopify store" value={STORE.domain} />
          <Row
            label="Tracking"
            value={
              <span className="inline-flex items-center gap-1.5 font-medium text-success-primary">
                <span className="size-1.5 rounded-full bg-success-500" />
                Receiving events
              </span>
            }
            hint={`Last event ${STORE.lastEvent}`}
          />
          <Row
            label="Shoppers who declined tracking"
            value={`${Math.round(STORE.consentDeniedShare * 100)}%`}
            hint="Cue cannot see these visits at all. Every percentage in the dashboard excludes them."
          />
        </dl>
      </Card>

      {/* Topics — the real control surface */}
      <Card>
        <CardHeader
          title="What Cue may talk about"
          description="Switch a topic off and Cue never brings it up, on any product."
        />
        <ul className="divide-y divide-[var(--border-secondary)]">
          {COVERAGE.map((row) => {
            const on = !muted.includes(row.topic);
            const empty = row.productsCovered === 0;
            const partial =
              !empty && row.productsCovered < row.productsTotal;

            return (
              <li
                key={row.topic}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p
                    className={cx(
                      "text-[13px] font-medium",
                      empty ? "text-tertiary" : "text-primary",
                    )}
                  >
                    {TOPIC_LABEL[row.topic]}
                  </p>
                  <p className="mt-0.5 text-[11px] text-tertiary">
                    {empty
                      ? "No product has this content, so Cue stays silent either way"
                      : `${row.productsCovered} of ${row.productsTotal} products have this content`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {empty && <Badge color="gray">Nothing to say</Badge>}
                  {partial && (
                    <Badge color="warning">
                      {row.productsTotal - row.productsCovered} missing
                    </Badge>
                  )}
                  <Toggle
                    checked={on && !empty}
                    onChange={(next) => toggleTopic(row.topic, next)}
                    label={`Allow Cue to talk about ${TOPIC_LABEL[row.topic]}`}
                    disabled={empty}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <footer className="flex items-center gap-2 border-t border-secondary px-6 py-3.5">
          <Check className="size-3.5 text-success-primary" strokeWidth={2} />
          <p className="text-[11px] text-tertiary">
            Changes take effect on the next page load. No publishing step.
          </p>
        </footer>
      </Card>

      {/* Privacy — named in the requirements, absent until now */}
      <Card>
        <CardHeader
          title="Privacy"
          description="What Cue keeps, and for how long."
        />
        <dl className="divide-y divide-[var(--border-secondary)]">
          <Row
            label="Shopper identity"
            value="Never stored"
            hint="Everything is anonymous and scoped to a single visit. No profile is built across visits or devices."
          />
          <Row
            label="Behaviour data"
            value="90 days"
            hint="Raw event rows are purged nightly after this window. Summaries are kept."
          />
          <Row
            label="Typed questions"
            value="Kept"
            hint="Questions shoppers type are stored with no retention limit yet."
          />
        </dl>
      </Card>

      {/* Turning it off — the one destructive action, given room and a confirm */}
      <Card className="border-error">
        <CardHeader
          title="Switch Cue off"
          description="Hides the widget on every page of your store and stops all recording. Nothing is deleted, and you can switch it back on at any time."
        />
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          {confirmingOff ? (
            <>
              <TriangleAlert
                className="size-4 shrink-0 text-error-primary"
                strokeWidth={2}
                aria-hidden
              />
              <p className="text-[13px] text-secondary">
                Shoppers will stop seeing Cue immediately. Sure?
              </p>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  hierarchy="secondary"
                  onClick={() => setConfirmingOff(false)}
                >
                  Keep it on
                </Button>
                <Button size="sm" hierarchy="destructive">
                  Yes, switch off
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] text-tertiary">
                The toggle in the top bar does the same thing.
              </p>
              <Button
                className="ml-auto"
                size="sm"
                hierarchy="destructive"
                onClick={() => setConfirmingOff(true)}
              >
                Switch off
              </Button>
            </>
          )}
        </div>
      </Card>

      <p className="flex items-center gap-1.5 px-1 text-[11px] text-quaternary">
        Installed on {STORE.domain}
        <ExternalLink className="size-3" strokeWidth={2} aria-hidden />
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="px-6 py-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[13px] font-medium text-primary">{label}</dt>
        <dd className="text-[13px] text-secondary">{value}</dd>
      </div>
      {hint && (
        <p className="mt-1 max-w-[52ch] text-[11px] leading-relaxed text-tertiary">
          {hint}
        </p>
      )}
    </div>
  );
}
