"use client";

import { Card, CardHeader } from "@/components/base/card";
import { Table, Td, Th, Tr } from "@/components/base/table";
import { Toggle } from "@/components/base/toggle";
import { cx } from "@/lib/cx";
import { formatShare, type Message, MESSAGES } from "@/lib/overview-data";
import { useState } from "react";

/**
 * Every line Cue serves, with the one number that decides whether it stays.
 *
 * Cart lift is the per-message difference against the held-back group, so a
 * message can be shown thousands of times, read often, and still be earning
 * nothing — which is exactly the case the sort order is built to surface.
 * Ranked by lift rather than by volume for that reason.
 */
export function MessagesTable() {
  const [off, setOff] = useState<string[]>(
    MESSAGES.filter((m) => !m.live).map((m) => m.id),
  );

  const ranked = [...MESSAGES].sort((a, b) => b.cartLift - a.cartLift);

  return (
    <Card>
      <CardHeader
        title="Your messages"
        description="Ranked by what each one adds against the held-back group. Switch off anything not earning its place."
      />
      <Table>
        <thead>
          <tr>
            <Th className="w-[44%]">Message</Th>
            <Th className="text-right">Shown</Th>
            <Th className="text-right">Engaged</Th>
            <Th className="text-right">Cart lift</Th>
            <Th className="text-right">Live</Th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              live={!off.includes(message.id)}
              onToggle={(next) =>
                setOff((current) =>
                  next
                    ? current.filter((id) => id !== message.id)
                    : [...current, message.id],
                )
              }
            />
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function MessageRow({
  message,
  live,
  onToggle,
}: {
  message: Message;
  live: boolean;
  onToggle: (live: boolean) => void;
}) {
  const earning = message.cartLift > 0.05;

  return (
    <Tr className={cx(!live && "opacity-55")}>
      <Td>
        <p className="text-[13px] font-medium text-primary">{message.title}</p>
        <p className="mt-0.5 text-[11px] text-tertiary">{message.trigger}</p>
      </Td>
      <Td className="text-right align-middle text-secondary tabular-nums">
        {message.shown.toLocaleString()}
      </Td>
      <Td className="text-right align-middle text-secondary tabular-nums">
        {formatShare(message.engagedShare)}
      </Td>
      <Td className="text-right align-middle">
        <span
          className={cx(
            "font-medium tabular-nums",
            earning ? "text-success-primary" : "text-error-primary",
          )}
        >
          {message.cartLift > 0 ? "+" : ""}
          {formatShare(message.cartLift)}
        </span>
        {!earning && (
          <p className="mt-0.5 text-[11px] text-quaternary">
            {message.cartLift < 0 ? "costing you sales" : "barely moving"}
          </p>
        )}
      </Td>
      <Td className="align-middle">
        <div className="flex justify-end">
          <Toggle
            checked={live}
            onChange={onToggle}
            label={`Serve "${message.title}" to shoppers`}
            size="sm"
          />
        </div>
      </Td>
    </Tr>
  );
}
