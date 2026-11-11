import { clampChroma, converter, formatHex } from "culori";
import { contrastValue, type ContrastMode } from "./contrast";
import { CONFUSABLE_BELOW, worstCaseDifference } from "./difference";

const LIGHTNESS_STEP = 0.004;

export interface LightnessFix {
  hex: string;
  /** Change in OKLCH lightness, -1 to 1. */
  deltaL: number;
}

const toOklch = converter("oklch");

/**
 * Finds the smallest lightness change (hue and chroma kept, chroma clamped to sRGB)
 * that makes the color acceptable. Returns null when no lightness works.
 */
export function findLightnessFix(hex: string, isAcceptable: (candidate: string) => boolean): LightnessFix | null {
  const base = toOklch(hex)!;
  const maxSteps = Math.ceil(1 / LIGHTNESS_STEP);
  for (let step = 1; step <= maxSteps; step++) {
    for (const direction of [1, -1]) {
      const lightness = base.l + direction * step * LIGHTNESS_STEP;
      if (lightness < 0 || lightness > 1) continue;
      const candidate = formatHex(clampChroma({ ...base, l: lightness }, "oklch"));
      if (candidate !== hex && isAcceptable(candidate)) {
        return { hex: candidate, deltaL: lightness - base.l };
      }
    }
  }
  return null;
}

/** Adjusts the text or the background color until the pair reaches the target contrast. */
export function fixContrast(
  mode: ContrastMode,
  text: string,
  background: string,
  target: number,
  adjust: "text" | "background",
): LightnessFix | null {
  return adjust === "text"
    ? findLightnessFix(text, (candidate) => contrastValue(mode, candidate, background) >= target)
    : findLightnessFix(background, (candidate) => contrastValue(mode, text, candidate) >= target);
}

/**
 * Adjusts one color of a confusable pair until the two can be told apart under every
 * vision type, without making it confusable with any other palette color.
 */
export function fixConfusablePair(hexes: string[], adjustIndex: number, partnerIndex: number): LightnessFix | null {
  const others = hexes.filter((_, index) => index !== adjustIndex && index !== partnerIndex);
  const floors = others.map((other) => Math.min(CONFUSABLE_BELOW, worstCaseDifference(hexes[adjustIndex], other).worst));
  return findLightnessFix(hexes[adjustIndex], (candidate) => {
    if (worstCaseDifference(candidate, hexes[partnerIndex]).worst < CONFUSABLE_BELOW) return false;
    return others.every((other, index) => worstCaseDifference(candidate, other).worst >= floors[index]);
  });
}
