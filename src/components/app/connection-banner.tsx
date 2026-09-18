import { Plug, Zap } from "lucide-react";
import { UNWIRED_KEYS, WIRED_COUNT } from "@/lib/wiring";

/**
 * States once, at the top of the page, where the numbers come from. Without
 * it a merchant has no way to tell a live dashboard from a demo one, and the
 * red dots below have nothing to sit against.
 */
export function ConnectionBanner({ live }: { live: boolean }) {
  if (live) {
    return (
      <div className="flex items-start gap-2.5 rounded-card border border-secondary bg-secondary px-4 py-3">
        <Zap
          className="mt-px size-3.5 shrink-0 text-success-primary"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-[12px] leading-relaxed text-tertiary">
          <span className="font-medium text-secondary">
            Connected to your store.
          </span>{" "}
          {WIRED_COUNT} figures are live. {UNWIRED_KEYS.length} are still
          placeholder — each one carries a{" "}
          <span className="inline-flex translate-y-px items-center">
            <span className="size-1.5 rounded-full bg-error-500" />
          </span>{" "}
          you can hover for the reason.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-card border border-[var(--utility-warning-200)] bg-[var(--utility-warning-50)] px-4 py-3">
      <Plug
        className="mt-px size-3.5 shrink-0 text-warning-primary"
        strokeWidth={2}
        aria-hidden
      />
      <p className="text-[12px] leading-relaxed text-[var(--utility-warning-700)]">
        <span className="font-medium">No store connected.</span> Every figure
        below is placeholder. Set <code>CUE_BACKEND_URL</code> and{" "}
        <code>CUE_SHOP_DOMAIN</code> to pull live data. The{" "}
        <span className="inline-flex translate-y-px items-center">
          <span className="size-1.5 rounded-full bg-error-500" />
        </span>{" "}
        markers show what stays placeholder even once connected.
      </p>
    </div>
  );
}
