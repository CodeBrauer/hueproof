import { converter } from "culori";
import { wcagRatio } from "./contrast";

export type Role = "background" | "surface" | "text" | "primary" | "accent";

export const ROLES: readonly Role[] = ["background", "surface", "text", "primary", "accent"];

/** A separate surface color only makes sense once the palette has colors to spare. */
const MIN_COLORS_FOR_SURFACE = 5;

const toOklch = converter("oklch");

/**
 * A first guess at interface roles: the lightest color as background, the darkest as text,
 * the most colorful of the rest as primary and accent. Returns indices into `hexes`.
 */
export function suggestRoles(hexes: string[]): Record<Role, number> {
  const colors = hexes.map((hex, index) => ({ index, ...toOklch(hex)! }));
  const byLightness = [...colors].sort((a, b) => b.l - a.l);
  const background = byLightness[0];
  const text = byLightness[byLightness.length - 1];
  let rest = byLightness.slice(1, -1);

  let surface = background;
  if (hexes.length >= MIN_COLORS_FOR_SURFACE) {
    surface = rest[0];
    rest = rest.slice(1);
  }
  const byChroma = [...rest].sort((a, b) => b.c - a.c);
  const primary = byChroma[0] ?? text;
  const accent = byChroma[1] ?? primary;

  return {
    background: background.index,
    surface: surface.index,
    text: text.index,
    primary: primary.index,
    accent: accent.index,
  };
}

/** The candidate that is easiest to read on the given background. */
export function bestOn(background: string, candidates: string[]): string {
  return candidates.reduce((best, candidate) =>
    wcagRatio(candidate, background) > wcagRatio(best, background) ? candidate : best,
  );
}
