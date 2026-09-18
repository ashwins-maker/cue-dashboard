import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type BadgeColor = "gray" | "brand" | "error" | "warning" | "success";

const COLOR: Record<BadgeColor, string> = {
  gray: "bg-[var(--utility-gray-50)] text-[var(--utility-gray-700)] ring-[var(--utility-gray-200)]",
  brand:
    "bg-[var(--utility-brand-50)] text-[var(--utility-brand-700)] ring-[var(--utility-brand-200)]",
  error:
    "bg-[var(--utility-error-50)] text-[var(--utility-error-700)] ring-[var(--utility-error-200)]",
  warning:
    "bg-[var(--utility-warning-50)] text-[var(--utility-warning-700)] ring-[var(--utility-warning-200)]",
  success:
    "bg-[var(--utility-success-50)] text-[var(--utility-success-700)] ring-[var(--utility-success-200)]",
};

const DOT: Record<BadgeColor, string> = {
  gray: "bg-gray-400",
  brand: "bg-brand-400",
  error: "bg-error-400",
  warning: "bg-warning-400",
  success: "bg-success-400",
};

export function Badge({
  color = "gray",
  dot = false,
  icon,
  children,
  className,
}: {
  color?: BadgeColor;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
        COLOR[color],
        className,
      )}
    >
      {dot && <span className={cx("size-1.5 rounded-full", DOT[color])} />}
      {icon}
      {children}
    </span>
  );
}
