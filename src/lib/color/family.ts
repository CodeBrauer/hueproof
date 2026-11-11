import { converter } from "culori";

export type ColorFamily =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "brown"
  | "black"
  | "white"
  | "gray";

// Boundaries in OKLCH (lightness 0–1, chroma, hue in degrees).
const GRAY_CHROMA = 0.02;
/** Very light and very dark colors still read as white or black with a slight tint. */
const TINTED_EXTREME_CHROMA = 0.04;
const WHITE_LIGHTNESS = 0.9;
const BLACK_LIGHTNESS = 0.22;
const NEAR_BLACK_LIGHTNESS = 0.16;
const PINK_LIGHTNESS = 0.7;
const BROWN_LIGHTNESS = 0.6;
const DARK_YELLOW_LIGHTNESS = 0.55;
const MAGENTA_PINK_LIGHTNESS = 0.6;

const toOklch = converter("oklch");

/** Maps a color to the closest of the eleven basic color terms. An approximation: the boundaries between terms are fuzzy. */
export function colorFamily(hex: string): ColorFamily {
  const { l, c, h = 0 } = toOklch(hex)!;

  if (c < TINTED_EXTREME_CHROMA) {
    if (l >= WHITE_LIGHTNESS) return "white";
    if (l <= BLACK_LIGHTNESS) return "black";
  }
  if (c < GRAY_CHROMA) return "gray";
  if (l <= NEAR_BLACK_LIGHTNESS) return "black";

  if (h < 40) return l >= PINK_LIGHTNESS ? "pink" : "red";
  if (h < 75) return l < BROWN_LIGHTNESS ? "brown" : "orange";
  if (h < 115) return l < DARK_YELLOW_LIGHTNESS ? "brown" : "yellow";
  if (h < 195) return "green";
  if (h < 285) return "blue";
  if (h < 325) return "purple";
  if (l >= MAGENTA_PINK_LIGHTNESS) return "pink";
  return h < 345 ? "purple" : "red";
}
