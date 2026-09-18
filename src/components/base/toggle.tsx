"use client";

import { cx } from "@/lib/cx";

export function Toggle({
  checked,
  onChange,
  label,
  size = "md",
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  size?: "sm" | "md";
  /** Use when flipping it would have no effect, not to signal lack of access. */
  disabled?: boolean;
}) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "size-4" : "size-5";
  const travel = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex shrink-0 rounded-full p-0.5 transition-colors",
        track,
        disabled
          ? "cursor-not-allowed bg-tertiary opacity-50"
          : cx("cursor-pointer", checked ? "bg-brand-solid" : "bg-quaternary"),
      )}
    >
      <span
        className={cx(
          "rounded-full shadow-xs-dark transition-transform",
          knob,
          disabled ? "bg-gray-400" : "bg-white",
          checked ? travel : "translate-x-0",
        )}
      />
    </button>
  );
}
