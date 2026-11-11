import { converter, wcagContrast } from "culori";
import { APCAcontrast, sRGBtoY } from "apca-w3";

export type ContrastMode = "wcag" | "apca";
/** Number of thresholds a pair meets: 0 = not enough, 1 = large text, 2 = body text, 3 = enhanced. */
export type ContrastTier = 0 | 1 | 2 | 3;

/** Thresholds for large text, body text and the enhanced level. APCA values follow the Bronze "simple mode" levels. */
export const CONTRAST_THRESHOLDS: Record<ContrastMode, readonly [number, number, number]> = {
  wcag: [3, 4.5, 7],
  apca: [60, 75, 90],
};

/** A value just below a threshold counts as a near miss when it reaches this share of it. */
const NEAR_MISS_RATIO = 0.85;

const toRgb = converter("rgb");

function toRgb255(hex: string): [number, number, number] {
  const rgb = toRgb(hex)!;
  return [Math.round(rgb.r * 255), Math.round(rgb.g * 255), Math.round(rgb.b * 255)];
}

/** WCAG 2 contrast ratio (1–21). Symmetric. */
export function wcagRatio(a: string, b: string): number {
  return wcagContrast(a, b);
}

/** Absolute APCA lightness contrast (Lc 0–~108). Depends on which color is the text. */
export function apcaLc(text: string, background: string): number {
  return Math.abs(APCAcontrast(sRGBtoY(toRgb255(text)), sRGBtoY(toRgb255(background))));
}

export function contrastValue(mode: ContrastMode, text: string, background: string): number {
  return mode === "wcag" ? wcagRatio(text, background) : apcaLc(text, background);
}

/** Contrast of a pair regardless of role: for APCA the weaker of the two polarities. */
export function pairContrast(mode: ContrastMode, a: string, b: string): number {
  return mode === "wcag" ? wcagRatio(a, b) : Math.min(apcaLc(a, b), apcaLc(b, a));
}

export function contrastTier(mode: ContrastMode, value: number): ContrastTier {
  return CONTRAST_THRESHOLDS[mode].filter((threshold) => value >= threshold).length as ContrastTier;
}

/** The threshold a value narrowly misses, or null when it is not close to one. */
export function nearMissTarget(mode: ContrastMode, value: number): number | null {
  const next = CONTRAST_THRESHOLDS[mode].find((threshold) => value < threshold);
  if (next === undefined) return null;
  return value >= next * NEAR_MISS_RATIO ? next : null;
}

/** Truncates instead of rounding so a failing 4.499 never reads as a passing 4.5. */
export function formatContrast(mode: ContrastMode, value: number): string {
  if (mode === "wcag") return `${(Math.floor(value * 100) / 100).toFixed(2)}:1`;
  return `Lc ${(Math.floor(value * 10) / 10).toFixed(1)}`;
}

export function formatThreshold(mode: ContrastMode, threshold: number): string {
  return mode === "wcag" ? `${threshold}:1` : `Lc ${threshold}`;
}

/** Black or white, whichever is easier to read on the given background. */
export function readableOn(background: string): "#000000" | "#ffffff" {
  return wcagRatio("#000000", background) >= wcagRatio("#ffffff", background) ? "#000000" : "#ffffff";
}
