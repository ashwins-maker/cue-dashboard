"use client";

import { Info } from "lucide-react";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Marks a number that is modelled, lagging, or correlational rather than
 * directly measured. Every soft metric in the app carries one — a merchant
 * should never have to guess which figures are estimates.
 *
 * The bubble renders in a portal with fixed positioning: table headers sit
 * inside a horizontally scrollable wrapper, which clips anything absolutely
 * positioned within it.
 */
export function InfoTip({
  label,
  children,
  align = "left",
}: {
  /** Short heading, e.g. "Modelled estimate" or "Lags 30 days". */
  label: string;
  /** How the number is produced and what it cannot prove. */
  children: string;
  /** Which edge of the trigger the bubble hangs from. Clamped to the viewport. */
  align?: "left" | "right";
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    below: boolean;
  } | null>(null);

  const WIDTH = 240;
  const GAP = 8;
  const MARGIN = 12;
  // Enough room for the tallest note in METRIC_NOTES at this width.
  const EST_HEIGHT = 108;

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();

    const preferred =
      align === "right" ? rect.right - WIDTH : rect.left - WIDTH / 2 + 8;

    // Flip beneath the trigger when there is not enough room above it —
    // otherwise the bubble is cut off by the top of the viewport.
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={position ? id : undefined}
        aria-label={`About this figure: ${label}`}
        onMouseEnter={place}
        onMouseLeave={close}
        onFocus={place}
        onBlur={close}
        onClick={(event) => {
          event.stopPropagation();
          if (position) close();
          else place();
        }}
        className="cursor-help align-middle text-quaternary transition-colors hover:text-secondary"
      >
        <Info className="size-3" strokeWidth={2} aria-hidden />
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
            className="pointer-events-none fixed z-50 rounded-xl border border-primary bg-overlay px-3 py-2 shadow-lg-dark"
          >
            <span className="block text-xs font-semibold text-primary">
              {label}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
              {children}
            </span>
          </span>,
          document.body,
        )}
    </>
  );
}
