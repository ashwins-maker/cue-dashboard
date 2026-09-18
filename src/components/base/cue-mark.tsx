/**
 * The Cue mark: a rounded shell, a darker core, and two eyes that blink.
 *
 * The blink is the whole point of the mark — it says the widget is watching
 * and mostly still. It runs on a long cycle so it reads as presence rather
 * than animation, and stops entirely under prefers-reduced-motion.
 *
 * Colours come from the app's own tokens rather than the source file's
 * literals, so the mark sits correctly on the rail in either theme.
 */
export function CueMark({
  className = "size-8",
  blink = true,
}: {
  className?: string;
  /** Turn off where a still mark is wanted, such as a favicon export. */
  blink?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Cue"
      className={className}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="28"
        className="fill-[var(--cue-mark-shell)]"
      />
      <rect
        x="19"
        y="19"
        width="62"
        height="62"
        rx="19"
        className="fill-[var(--cue-mark-core)]"
      />
      <circle
        cx="40.5"
        cy="50"
        r="6.6"
        className={blink ? "cue-eye" : undefined}
        fill="var(--cue-mark-eye)"
      />
      <circle
        cx="59.5"
        cy="50"
        r="6.6"
        className={blink ? "cue-eye" : undefined}
        fill="var(--cue-mark-eye)"
      />
    </svg>
  );
}
