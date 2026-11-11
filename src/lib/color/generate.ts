import { clampChroma, converter, formatHex } from "culori";

/** Hue offsets of the schemes the generator picks from. */
const SCHEMES: readonly (readonly number[])[] = [[0], [0, 30, -30], [0, 180], [0, 150, 210], [0, 120, 240]];
const LIGHTNESS_MIN = 0.25;
const LIGHTNESS_MAX = 0.94;
const CHROMA_MIN = 0.03;
const CHROMA_MAX = 0.17;
const HUE_JITTER = 10;
const MIN_CHROMA_FOR_HUE = 0.02;

const toOklch = converter("oklch");

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/**
 * New colors for every unlocked slot. The hue scheme starts from the first locked,
 * non-gray color so that generated colors fit what the user decided to keep.
 */
export function generateColors(current: { hex: string; locked: boolean }[], random: () => number = Math.random): string[] {
  const anchor = current
    .filter((color) => color.locked)
    .map((color) => toOklch(color.hex)!)
    .find((color) => color.c >= MIN_CHROMA_FOR_HUE && color.h !== undefined);
  const baseHue = anchor?.h ?? random() * 360;
  const offsets = SCHEMES[Math.floor(random() * SCHEMES.length)];

  const count = current.length;
  const evenLightness = current.map((_, index) =>
    count === 1 ? 0.6 : LIGHTNESS_MIN + ((LIGHTNESS_MAX - LIGHTNESS_MIN) * index) / (count - 1),
  );
  const lightness = random() < 0.5 ? evenLightness : shuffle(evenLightness, random);

  return current.map((color, index) => {
    if (color.locked) return color.hex;
    const offset = offsets[Math.floor(random() * offsets.length)];
    const hue = (baseHue + offset + (random() * 2 - 1) * HUE_JITTER + 360) % 360;
    const chroma = CHROMA_MIN + (CHROMA_MAX - CHROMA_MIN) * random();
    return formatHex(clampChroma({ mode: "oklch", l: lightness[index], c: chroma, h: hue }, "oklch"));
  });
}

/** A color halfway between two neighbours, used when inserting a column. */
export function midpoint(a: string, b: string): string {
  const first = toOklch(a)!;
  const second = toOklch(b)!;
  const hueA = first.h ?? second.h ?? 0;
  const hueB = second.h ?? hueA;
  // Take the shorter way around the hue circle.
  const delta = ((hueB - hueA + 540) % 360) - 180;
  return formatHex(
    clampChroma(
      { mode: "oklch", l: (first.l + second.l) / 2, c: (first.c + second.c) / 2, h: (hueA + delta / 2 + 360) % 360 },
      "oklch",
    ),
  );
}
