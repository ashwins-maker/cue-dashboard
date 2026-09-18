import { Card, CardHeader } from "@/components/base/card";
import { formatCount, type TopicDemand } from "@/lib/overview-data";

/**
 * Topic demand as a proper bar chart: a fixed plot area with a value axis,
 * gridlines behind the bars, and a split fill for the part the store cannot
 * answer.
 *
 * Built from CSS grid rather than SVG so the labels and values stay crisp
 * text at any card width. The gridline layer is absolutely positioned over
 * the plot column, which is why the three column widths below are fixed —
 * the overlay's insets have to match them.
 *
 * There is no third "thin answer" colour: `lowConfidence` is unwired, so a
 * thin answer cannot be distinguished from a solid one.
 */

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

export function TopicDemandChart({ rows }: { rows: TopicDemand[] }) {
  const max = niceMax(Math.max(0, ...rows.map((r) => r.sessions)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  const grid = {
    gridTemplateColumns: `${LABEL_W}px minmax(0,1fr) ${VALUE_W}px`,
    columnGap: `${GAP}px`,
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="What shoppers got stuck on"
        description="Times a shopper hesitated, by topic. Red is the part your pages cannot answer."
      />

      <div className="flex-1 px-5 py-5">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-tertiary">
            No friction recorded in this period.
          </p>
        ) : (
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-7"
              style={{
                left: LABEL_W + GAP,
                right: VALUE_W + GAP,
              }}
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
                          style={{
                            width: `${(answered / row.sessions) * 100}%`,
                          }}
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
        )}
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
    </Card>
  );
}
