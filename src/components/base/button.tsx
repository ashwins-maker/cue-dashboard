import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Hierarchy = "primary" | "secondary" | "tertiary" | "destructive";
type Size = "sm" | "md" | "lg";

// Primary is solid white on near-black — the highest-contrast thing on screen,
// so it is spent on one action per view. The accent stays for state, not for
// buttons.
const HIERARCHY: Record<Hierarchy, string> = {
  primary: "bg-white text-on-solid hover:bg-gray-200 shadow-xs-dark",
  secondary:
    "bg-tertiary text-secondary border border-primary hover:bg-quaternary hover:text-primary",
  tertiary: "text-tertiary hover:text-primary hover:bg-tertiary",
  destructive: "bg-error-solid text-on-brand hover:bg-error-500 shadow-xs-dark",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 gap-1.5 px-3 text-xs",
  md: "h-9 gap-1.5 px-3.5 text-[13px]",
  lg: "h-10 gap-2 px-4 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hierarchy?: Hierarchy;
  size?: Size;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
}

export function Button({
  hierarchy = "secondary",
  size = "md",
  iconLeading,
  iconTrailing,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        HIERARCHY[hierarchy],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {iconLeading}
      {children}
      {iconTrailing}
    </button>
  );
}
