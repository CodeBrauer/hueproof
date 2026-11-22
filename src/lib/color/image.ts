import { extractPalette, MmcqQuantizer, validateOptions } from "colorthief/internals";
import { formatHex } from "culori";
import { MAX_COLORS, MIN_COLORS } from "./types";

/** RGBA bytes row by row, as in `ImageData`. */
export interface Pixels {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

/** A point on an image as fractions of its width and height, 0 to 1 from the top left. */
export interface ImagePoint {
  x: number;
  y: number;
}

/** Pixels with a lower alpha (0–255) count as transparent: they add no color and cannot be picked. Heuristic, colorthief's default. */
export const MIN_VISIBLE_ALPHA = 125;
/** Larger images are sampled at every n-th pixel. Enough for the dominant colors and quick to sort; heuristic. */
export const MAX_SAMPLED_PIXELS = 65_536;

const CHANNELS = 4;
const ALPHA_OFFSET = 3;
const BYTE_MAX = 255;

const quantizer = new MmcqQuantizer();

function hasVisiblePixel({ data }: Pixels): boolean {
  for (let offset = ALPHA_OFFSET; offset < data.length; offset += CHANNELS) {
    if (data[offset] >= MIN_VISIBLE_ALPHA) return true;
  }
  return false;
}

/**
 * The dominant colors of an image, most common first: median cut in OKLCH, through colorthief.
 * An image with no more distinct colors than asked for returns exactly those.
 */
export function dominantColors(pixels: Pixels, count: number): string[] {
  if (!hasVisiblePixel(pixels)) return [];
  const options = validateOptions({
    colorCount: Math.min(Math.max(count, MIN_COLORS), MAX_COLORS),
    quality: Math.max(1, Math.ceil((pixels.width * pixels.height) / MAX_SAMPLED_PIXELS)),
    // White is a palette color like any other. colorthief leaves it out by default.
    ignoreWhite: false,
    alphaThreshold: MIN_VISIBLE_ALPHA,
  });
  const colors = extractPalette(pixels.data, pixels.width, pixels.height, options, quantizer) ?? [];
  const byShare = [...colors].sort((a, b) => b.population - a.population);
  return [...new Set(byShare.map((color) => color.hex()))];
}

export function clampPoint({ x, y }: ImagePoint): ImagePoint {
  return { x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) };
}

/** The color of the pixel under a point, or null where the image is transparent. */
export function colorAt(pixels: Pixels, point: ImagePoint): string | null {
  const { x, y } = clampPoint(point);
  const column = Math.min(Math.floor(x * pixels.width), pixels.width - 1);
  const row = Math.min(Math.floor(y * pixels.height), pixels.height - 1);
  const offset = (row * pixels.width + column) * CHANNELS;
  const { data } = pixels;
  if (!(data[offset + ALPHA_OFFSET] >= MIN_VISIBLE_ALPHA)) return null;
  return formatHex({ mode: "rgb", r: data[offset] / BYTE_MAX, g: data[offset + 1] / BYTE_MAX, b: data[offset + 2] / BYTE_MAX });
}
