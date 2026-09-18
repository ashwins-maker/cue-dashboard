"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WIRING, type WiringKey } from "@/lib/wiring";

/**
 * A red dot marking a figure that is not yet backed by the Cue backend.
 *
 * Deliberately louder than InfoTip's grey icon: an InfoTip says "this number
 * is real but approximate", a red dot says "this number is placeholder". They
 * must never be mistaken for each other, so they do not share a colour.
 *
 * Renders nothing at all when the field is wired, so call sites can mark
 * every field unconditionally and the dots disappear as the backend catches
 * up — no UI edit needed to retire one.
 */
export function NotWired({
  field,
  align = "left",
}: {
  field: WiringKey;
  align?: "left" | "right";
}) {
  const entry = WIRING[field];
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    below: boolean;
  } | null>(null);

  const WIDTH = 280;
  const GAP = 8;
  const MARGIN = 12;
  const EST_HEIGHT = 150;

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const preferred =
      align === "right" ? rect.right - WIDTH : rect.left - WIDTH / 2 + 8;
    const below = rect.top - GAP - EST_HEIGHT < MARGIN;

    setPosition({
      below,
      top: below ? rect.bottom + GAP : rect.top - GAP,
      left: Math.min(
        Math.max(preferred, MARGIN),
        window.innerWidth - WIDTH - MARGIN,
      ),
    });
  }, [align]);

  const close = useCallback(() => setPosition(null), []);

  useLayoutEffect(() => {
    if (!position) return;
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position, close]);

  if (entry.wired) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={position ? id : undefined}
        aria-label="Placeholder figure — not yet connected to live data"
        onMouseEnter={place}
        onMouseLeave={close}
        onFocus={place}
        onBlur={close}
        onClick={(event) => {
          event.stopPropagation();
          if (position) close();
          else place();
        }}
        className="inline-flex cursor-help items-center align-middle"
      >
        <span className="size-1.5 rounded-full bg-error-500 ring-2 ring-[var(--bg-error-halo)]" />
      </button>

      {position &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            style={{
              top: position.top,
              left: position.left,
              width: WIDTH,
              transform: position.below ? undefined : "translateY(-100%)",
            }}
            className="pointer-events-none fixed z-50 rounded-xl border border-error bg-overlay px-3 py-2.5 shadow-lg-dark"
          >
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-error-500" />
              <span className="text-xs font-semibold text-error-primary">
                Placeholder — not connected
              </span>
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-secondary">
              {entry.reason}
            </span>
            {entry.fix && (
              <span className="mt-1.5 block border-t border-secondary pt-1.5 text-xs leading-relaxed text-quaternary">
                <span className="font-medium text-tertiary">To connect: </span>
                {entry.fix}
              </span>
            )}
          </span>,
          document.body,
        )}
    </>
  );
}

/**
 * Companion to NotWired for fields that ARE live: a quiet provenance note, so
 * "no red dot" reads as a deliberate statement rather than an omission.
 */
export function wiringSourceNote(field: WiringKey): string | null {
  const entry = WIRING[field];
  return entry.wired ? (entry.source ?? null) : null;
}
