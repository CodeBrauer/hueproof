import { LOGO_CHECK_PATH, LOGO_CHECK_WIDTH, LOGO_RING_WIDTH, logoArcs } from "@/lib/palette-image";

/** A ring made of the given colors with a check mark inside: a palette that has been proofed. */
export function Logo({ colors, className }: { colors: readonly string[]; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* A faint ring behind the segments keeps colors close to the page background visible. */}
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth={LOGO_RING_WIDTH + 1.6} />
      {logoArcs(colors.length).map((path, index) => (
        <path key={index} d={path} fill="none" stroke={colors[index]} strokeWidth={LOGO_RING_WIDTH} />
      ))}
      <path
        d={LOGO_CHECK_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={LOGO_CHECK_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
