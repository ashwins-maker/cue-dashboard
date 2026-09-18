"use client";

import { cx } from "@/lib/cx";

export interface ButtonGroupOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Underlined tabs rather than a pill segment.
 *
 * A pill reads as a filter applied to one dataset; an underline reads as a
 * change of view. Both places this is used are switching between views of
 * the same rows, so the underline is the honest affordance — and it stops
 * the control competing with the buttons beside it in a card header.
 */
export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ButtonGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex items-center gap-4">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              "relative -mb-px cursor-pointer border-b-2 px-0.5 pt-1 pb-2 text-xs font-medium whitespace-nowrap transition-colors",
              selected
                ? "border-brand-solid text-primary"
                : "border-transparent text-tertiary hover:text-secondary",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cx(
                  "ml-1.5 tabular-nums",
                  selected ? "text-tertiary" : "text-quaternary",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
