import { converter } from "culori";

/**
 * Warm–cool estimate after the colour-heat model of Ou et al. (2004):
 * warmth grows with chroma and peaks at a CIELAB hue of 50°.
 * The model's constant offset is left out so that near-neutral colors read as neutral.
 */
const WARMEST_HUE = 50;
const CHROMA_EXPONENT = 1.07;
const CHROMA_WEIGHT = 0.02;
const NEUTRAL_BAND = 0.12;
/** Warmth at which a color sits at the end of the cool–warm scale in the UI. */
export const WARMTH_SCALE_MAX = 1.5;

export type Temperature = "warm" | "neutral" | "cool";

const toLch = converter("lch65");

/** Positive for warm colors, negative for cool ones. Roughly -2 to 2. */
export function warmth(hex: string): number {
  const { c, h = 0 } = toLch(hex)!;
  return CHROMA_WEIGHT * c ** CHROMA_EXPONENT * Math.cos(((h - WARMEST_HUE) * Math.PI) / 180);
}

export function classifyTemperature(hex: string): Temperature {
  const value = warmth(hex);
  if (value > NEUTRAL_BAND) return "warm";
  if (value < -NEUTRAL_BAND) return "cool";
  return "neutral";
}

/** Share of warm, neutral and cool colors in a palette, each 0–1. */
export function temperatureBalance(hexes: string[]): Record<Temperature, number> {
  const balance: Record<Temperature, number> = { warm: 0, neutral: 0, cool: 0 };
  for (const hex of hexes) balance[classifyTemperature(hex)] += 1 / hexes.length;
  return balance;
}
