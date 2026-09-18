"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Toggle } from "@/components/base/toggle";
import { cx } from "@/lib/cx";
import { STORE } from "@/lib/merchant-data";

const PERIODS = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This quarter",
] as const;

/**
 * The header carries only controls that change what the whole page shows: the
 * period, and whether Cue is live. The search field that used to sit here was
 * removed — it was the first thing a merchant clicked and it did nothing.
 */
export function AppHeader() {
  const [live, setLive] = useState(true);
  const [period, setPeriod] = useState<string>(STORE.period);
  const [periodOpen, setPeriodOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!periodOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node))
        setPeriodOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPeriodOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [periodOpen]);

  return (
    <>
      <header className="flex flex-wrap items-center gap-2.5 bg-rail px-5 py-3">
        <div className="relative mr-auto" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={periodOpen}
            onClick={() => setPeriodOpen((open) => !open)}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-secondary bg-secondary px-3.5 text-[13px] font-medium text-secondary hover:bg-tertiary hover:text-primary"
          >
            <Calendar className="size-3.5" strokeWidth={1.75} aria-hidden />
            {period}
            <ChevronDown
              className="size-3.5 text-tertiary"
              strokeWidth={1.75}
              aria-hidden
            />
          </button>

          {periodOpen && (
            <ul
              role="listbox"
              className="absolute right-0 z-30 mt-1.5 w-44 rounded-xl border border-primary bg-overlay p-1 shadow-lg-dark"
            >
              {PERIODS.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === period}
                    onClick={() => {
                      setPeriod(option);
                      setPeriodOpen(false);
                    }}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors",
                      option === period
                        ? "bg-tertiary text-primary"
                        : "text-secondary hover:bg-primary-alt",
                    )}
                  >
                    {option}
                    {option === period && (
                      <Check
                        className="ml-auto size-3.5 text-brand-400"
                        strokeWidth={2}
                        aria-hidden
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex h-9 items-center gap-2.5 rounded-full border border-secondary bg-secondary px-3.5">
          <span className="text-[13px] font-medium text-secondary">
            {live ? "Cue is live" : "Cue is off"}
          </span>
          <Toggle
            checked={live}
            onChange={setLive}
            label="Turn Cue on or off across the whole store"
            size="sm"
          />
        </div>
      </header>

      {!live && (
        <div
          role="status"
          className="bg-[var(--utility-warning-50)] px-6 py-2 text-[13px] text-[var(--utility-warning-700)]"
        >
          Cue is switched off. The widget is hidden on every page of{" "}
          {STORE.domain}, and nothing is being recorded.
        </div>
      )}
    </>
  );
}
