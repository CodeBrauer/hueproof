import { LOGO_CHECK_PATH, LOGO_CHECK_WIDTH, LOGO_RING_WIDTH, logoArcs, wordmarkColors } from "@/lib/palette-image";
import { CONTRAST_THRESHOLDS } from "@/lib/color/contrast";
import { ensureContrast } from "@/lib/color/fix";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

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

/**
 * Page background of each theme as hex, for contrast math. Keep in sync with `--background` in globals.css
 * (`oklch(1 0 0)` and `oklch(0.165 0 0)`).
 */
const PAGE_BACKGROUND = { light: "#ffffff", dark: "#0e0e0e" } as const;
/**
 * A logotype has no contrast requirement (WCAG 2.2, SC 1.4.3), but Hueproof's own holds the level for normal
 * text, AA 4.5:1, in both themes.
 */
const WORDMARK_CONTRAST = CONTRAST_THRESHOLDS.wcag[1];

/**
 * The name, each letter in the hue of a palette color. A letter below 4.5:1 on the page background gets the
 * smallest lightness change that reaches it, the same fix the tool offers for any pair. Both themes' colors are
 * set as variables and CSS picks one, so the markup does not depend on the theme.
 */
export function Wordmark({ colors, className }: { colors: readonly string[]; className?: string }) {
  const letterColors = wordmarkColors(colors, SITE_NAME.length);
  return (
    <span aria-hidden="true" className={cn("font-display leading-none uppercase", className)}>
      {[...SITE_NAME].map((letter, index) => (
        <span
          key={index}
          className="[color:var(--letter-light)] dark:[color:var(--letter-dark)]"
          style={
            {
              "--letter-light": ensureContrast("wcag", letterColors[index], PAGE_BACKGROUND.light, WORDMARK_CONTRAST),
              "--letter-dark": ensureContrast("wcag", letterColors[index], PAGE_BACKGROUND.dark, WORDMARK_CONTRAST),
            } as React.CSSProperties
          }
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
