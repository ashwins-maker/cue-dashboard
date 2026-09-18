"use client";

import { cx } from "@/lib/cx";

export interface ButtonGroupOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

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
    <div className="inline-flex rounded-full border border-secondary bg-primary-alt p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cx(
              "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              selected
                ? "bg-quaternary text-primary shadow-xs-dark"
                : "text-tertiary hover:text-secondary",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cx(
                  "rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums",
                  selected
                    ? "bg-quaternary text-secondary"
                    : "bg-tertiary text-tertiary",
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
