import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  );
}

export function Th({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cx(
        "border-b border-secondary bg-secondary-alt px-5 py-2.5 text-left text-[11px] font-medium whitespace-nowrap text-quaternary",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx(
        "border-b border-tertiary px-5 py-3.5 align-top text-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  onClick,
  selected = false,
}: {
  children: ReactNode;
  className?: string;
  /** Makes the whole row activate the detail panel, by pointer or keyboard. */
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <tr
      className={cx(
        "transition-colors hover:bg-primary",
        onClick && "cursor-pointer",
        selected && "bg-primary",
        className,
      )}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-expanded={onClick ? selected : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </tr>
  );
}
