import { converter, formatHex, interpolate } from "culori";

const VARIATION_STEPS = 8;
const TONE_STEPS = 9;
const MONOCHROME_LIGHTNESS_STEP = 0.1;
const SIMILAR_HUE_STEP = 8;

const toHsl = converter("hsl");

function fromHsl(h: number, s: number, l: number): string {
  return formatHex({ mode: "hsl", h: ((h % 360) + 360) % 360, s, l });
}

function mixTowards(hex: string, target: string): string[] {
  const mix = interpolate([hex, target], "rgb");
  return Array.from({ length: VARIATION_STEPS }, (_, index) => formatHex(mix((index + 1) / (VARIATION_STEPS + 1))));
}

/** The color mixed with increasing amounts of black. */
export function shades(hex: string): string[] {
  return mixTowards(hex, "#000000");
}

/** The color mixed with increasing amounts of white. */
export function tints(hex: string): string[] {
  return mixTowards(hex, "#ffffff");
}

/** Same hue and lightness, from gray to fully saturated. */
export function tones(hex: string): string[] {
  const { h = 0, l } = toHsl(hex)!;
  return Array.from({ length: TONE_STEPS }, (_, index) => fromHsl(h, index / (TONE_STEPS - 1), l));
}

export type HarmonyId =
  | "complementary"
  | "analogous"
  | "split"
  | "triadic"
  | "tetradic"
  | "square"
  | "monochromatic";

export interface Harmony {
  id: HarmonyId;
  colors: string[];
}

const HARMONY_OFFSETS: readonly { id: HarmonyId; offsets: readonly number[] }[] = [
  { id: "complementary", offsets: [0, 180] },
  { id: "analogous", offsets: [-30, 0, 30] },
  { id: "split", offsets: [0, 150, 210] },
  { id: "triadic", offsets: [0, 120, 240] },
  { id: "tetradic", offsets: [0, 60, 180, 240] },
  { id: "square", offsets: [0, 90, 180, 270] },
];

/** Classic color-wheel harmonies: hue rotations in HSL, the convention most color tools share. */
export function harmonies(hex: string): Harmony[] {
  const { h = 0, s, l } = toHsl(hex)!;
  const rotated = HARMONY_OFFSETS.map(({ id, offsets }) => ({
    id,
    colors: offsets.map((offset) => (offset === 0 ? hex : fromHsl(h + offset, s, l))),
  }));
  const monochromatic = [-3, -2, -1, 0, 1, 2, 3].map((step) =>
    step === 0 ? hex : fromHsl(h, s, Math.min(0.95, Math.max(0.05, l + step * MONOCHROME_LIGHTNESS_STEP))),
  );
  return [...rotated, { id: "monochromatic", colors: monochromatic }];
}

/** Close neighbours on the hue wheel. */
export function similarColors(hex: string): string[] {
  const { h = 0, s, l } = toHsl(hex)!;
  return [-3, -2, -1, 0, 1, 2, 3].map((step) => (step === 0 ? hex : fromHsl(h + step * SIMILAR_HUE_STEP, s, l)));
}
