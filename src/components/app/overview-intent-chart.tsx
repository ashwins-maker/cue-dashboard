import { Card, CardHeader } from "@/components/base/card";
import { INTENTS, type IntentPerformance } from "@/lib/nudge-data";
import { formatCount, formatShare } from "@/lib/overview-data";

/**
 * Which kinds of question Cue actually settles.
 *
 * A bullet chart: the outer bar is how many cards were shown for that kind of
 * question, the inner bar is how many ended the hesitation. Bar length is
 * volume, fill is success — so a short-but-full row and a long-but-empty row
 * are distinguishable at a glance, which a plain percentage list hides.
 *
 * Both numbers are wired: `nudgeEngagement` for what was shown,
 * `postNudgeResolution` for what settled afterwards.
 *
 * Settling is measured from what the shopper did next — stopped flipping
 * sizes, stopped reopening the size chart, stopped hunting the policy page —
 * not from whether they touched the card, and not from whether they bought.
 */
const LABEL_W = 152;
const RATE_W = 44;
const COUNT_W = 52;
const GAP = 12;

export function IntentChart({ rows }: { rows: IntentPerformance[] }) {
  const shownRows = rows.filter((row) => row.shown > 0);

  if (shownRows.length === 0) {
    return (
      <Card>
        <CardHeader title="What Cue settles" />
        <p className="px-5 py-10 text-center text-[13px] text-tertiary">
          No cards shown in this period.
        </p>
      </Card>
    );
  }

  const ordered = [...shownRows].sort((a, b) => b.shown - a.shown);
  const max = Math.max(...ordered.map((row) => row.shown));

  const grid = {
    gridTemplateColumns: `${LABEL_W}px minmax(0,1fr) ${RATE_W}px ${COUNT_W}px`,
    columnGap: `${GAP}px`,
  };

  return (
    <Card>
      <CardHeader
        title="What Cue settles"
        description="Cards shown for each kind of question, and how many ended the hesitation."
      />

      <div className="px-5 py-5">
        <ol className="grid items-center gap-y-3" style={grid}>
          <li className="contents" aria-hidden>
            <span />
            <span className="text-[10px] text-quaternary">
              Cards shown, with the settled portion filled
            </span>
            <span className="text-right text-[10px] text-quaternary">
              Settled
            </span>
            <span className="text-right text-[10px] text-quaternary">Shown</span>
          </li>

          {ordered.map((row) => {
            const intent = INTENTS[row.intent];
            const rate = row.resolved / row.shown;

            return (
              <li key={row.intent} className="contents">
                <span className="truncate text-[12px] text-secondary">
                  {intent?.label ?? row.intent}
                </span>

                <span
                  role="img"
                  aria-label={`${intent?.label ?? row.intent}: ${formatCount(row.shown)} cards shown, ${formatCount(row.resolved)} settled, ${formatShare(rate)}.`}
                  className="relative block h-4 rounded-[3px]"
                  style={{
                    width: `${(row.shown / max) * 100}%`,
                    backgroundColor: "var(--chart-accent-soft)",
                  }}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-[3px]"
                    style={{
                      width: `${rate * 100}%`,
                      backgroundColor: "var(--chart-accent)",
                    }}
                  />
                </span>

                <span className="text-right text-[12px] font-medium text-primary tabular-nums">
                  {formatShare(rate)}
                </span>
                <span className="text-right text-[12px] text-tertiary tabular-nums">
                  {formatCount(row.shown)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-secondary px-5 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <span
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: "var(--chart-accent)" }}
          />
          Hesitation ended
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <span
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: "var(--chart-accent-soft)" }}
          />
          Shown, still hesitating
        </span>
        <span className="text-[11px] text-quaternary">
          Measured from what the shopper did next, not from whether they bought.
        </span>
      </footer>
    </Card>
  );
}
