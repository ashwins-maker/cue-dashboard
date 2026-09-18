"use client";

import {
  LayoutDashboard,
  MessageCircleQuestion,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { FRICTION_POINTS, STORE } from "@/lib/merchant-data";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  {
    href: "/friction-points",
    label: "Friction points",
    icon: MessageCircleQuestion,
  },
  { href: "/nudges", label: "Nudges", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const gapCount = FRICTION_POINTS.filter(
    (p) => p.contentState === "uncovered",
  ).length;

  return (
    <aside className="flex w-[228px] shrink-0 flex-col bg-rail">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white">
          <span className="flex gap-[3px]">
            <span className="size-1 rounded-full bg-gray-950" />
            <span className="size-1 rounded-full bg-gray-950" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-primary">
            Cue
          </p>
          <p className="truncate text-[11px] text-tertiary">{STORE.name}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-1">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-tertiary text-primary"
                  : "text-tertiary hover:bg-primary-alt hover:text-secondary",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === "/friction-points" && gapCount > 0 && (
                <span className="rounded-full bg-[var(--utility-error-50)] px-1.5 py-px text-[11px] font-medium text-[var(--utility-error-700)] tabular-nums ring-1 ring-[var(--utility-error-200)] ring-inset">
                  {gapCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-secondary bg-secondary px-3.5 py-3">
        <p className="text-[11px] text-tertiary">
          Tracking{" "}
          <span className="inline-flex items-center gap-1.5 font-medium text-success-primary">
            <span className="size-1.5 rounded-full bg-success-500" />
            active
          </span>
        </p>
        <p className="mt-0.5 text-[11px] text-quaternary">
          Last event {STORE.lastEvent}
        </p>
      </div>
    </aside>
  );
}
