import { Badge } from "@/components/base/badge";
import { Card, CardHeader } from "@/components/base/card";
import { NotWired } from "@/components/base/not-wired";
import { Table, Td, Th, Tr } from "@/components/base/table";
import { COVERAGE, TOPIC_LABEL } from "@/lib/merchant-data";

/**
 * Supply side of the same problem as the friction table above it: what the
 * catalog actually holds. Derived from store content alone, so it is the one
 * view that is populated on install day, before any traffic exists.
 */
export function CatalogCoverage() {
  const rows = [...COVERAGE].sort(
    (a, b) =>
      a.productsCovered / a.productsTotal - b.productsCovered / b.productsTotal,
  );

  const missingFields = rows.reduce(
    (sum, row) => sum + (row.productsTotal - row.productsCovered),
    0,
  );

  return (
    <Card>
      <CardHeader
        title="Catalog coverage"
        description={`Which topics the catalog can answer at all. ${missingFields} product fields missing across ${rows[0]?.productsTotal ?? 0} products — derived from store content, no traffic required.`}
      />
      <Table>
        <thead>
          <tr>
            <Th className="w-[28%]">
              <span className="inline-flex items-center gap-1">
                Topic
                <NotWired field="topicCoverage" />
              </span>
            </Th>
            <Th className="w-[34%]">Products covered</Th>
            <Th className="text-right">
              <span className="inline-flex items-center gap-1">
                Sessions seeking
                <NotWired field="product" align="right" />
              </span>
            </Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const share = row.productsCovered / row.productsTotal;
            const status =
              share === 1
                ? { label: "Complete", color: "success" as const }
                : share >= 0.75
                  ? { label: "Partial", color: "warning" as const }
                  : { label: "Minimal", color: "error" as const };

            return (
              <Tr key={row.topic}>
                <Td className="font-medium text-primary">
                  {TOPIC_LABEL[row.topic]}
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-1.5 w-36 overflow-hidden rounded-full bg-quaternary"
                      role="img"
                      aria-label={`${row.productsCovered} of ${row.productsTotal} products covered`}
                    >
                      <div
                        className={
                          share === 1
                            ? "h-full rounded-full bg-success-500"
                            : "h-full rounded-full bg-brand-500"
                        }
                        style={{ width: `${Math.max(share * 100, 1.5)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-tertiary tabular-nums">
                      {row.productsCovered}/{row.productsTotal}
                    </span>
                  </div>
                </Td>
                <Td className="text-right font-medium text-primary tabular-nums">
                  {row.sessionsSeeking.toLocaleString()}
                </Td>
                <Td>
                  <Badge color={status.color} dot>
                    {status.label}
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}
