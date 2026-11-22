import { extractPalette, MmcqQuantizer, validateOptions } from "colorthief/internals";
import { converter, differenceEuclidean, formatHex, type Oklab } from "culori";
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
/** Markers look for a color on a grid of about this many cells per side, so they land on an area, not a stray pixel. Heuristic. */
export const LOCATION_GRID = 32;
/** Cells this close to the best match count as just as good: about one just noticeable difference in OKLab. Heuristic. */
export const LOCATION_TOLERANCE = 0.02;

const CHANNELS = 4;
const ALPHA_OFFSET = 3;
const BYTE_MAX = 255;

const quantizer = new MmcqQuantizer();
const toOklab = converter("oklab");
const oklabDistance = differenceEuclidean("oklab");

interface GridCell {
  center: ImagePoint;
  color: Oklab;
}

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

/** The average color of each grid cell that has visible pixels. */
function gridCells({ data, width, height }: Pixels): GridCell[] {
  const size = Math.max(1, Math.ceil(Math.max(width, height) / LOCATION_GRID));
  const cells: GridCell[] = [];
  for (let top = 0; top < height; top += size) {
    for (let left = 0; left < width; left += size) {
      const bottom = Math.min(top + size, height);
      const right = Math.min(left + size, width);
      const sum = [0, 0, 0];
      let count = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const offset = (y * width + x) * CHANNELS;
          if (data[offset + ALPHA_OFFSET] < MIN_VISIBLE_ALPHA) continue;
          sum[0] += data[offset];
          sum[1] += data[offset + 1];
          sum[2] += data[offset + 2];
          count++;
        }
      }
      if (count === 0) continue;
      const [r, g, b] = sum.map((channel) => channel / count / BYTE_MAX);
      cells.push({ center: { x: (left + right) / 2 / width, y: (top + bottom) / 2 / height }, color: toOklab({ mode: "rgb", r, g, b }) });
    }
  }
  return cells;
}

function middleOf(points: ImagePoint[]): ImagePoint {
  const sum = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function nearestTo(target: ImagePoint, points: ImagePoint[]): ImagePoint {
  const distance = (point: ImagePoint) => Math.hypot(point.x - target.x, point.y - target.y);
  return points.reduce((nearest, point) => (distance(point) < distance(nearest) ? point : nearest));
}

/**
 * Where each color sits in the image, for a marker: of the grid cells that match it best, the one nearest to their
 * middle, so the marker lands inside a large area of that color. Null when the image has no visible pixel.
 */
export function colorLocations(pixels: Pixels, hexes: readonly string[]): (ImagePoint | null)[] {
  const cells = gridCells(pixels);
  return hexes.map((hex) => {
    const target = toOklab(hex);
    if (cells.length === 0 || !target) return null;
    const distances = cells.map((cell) => oklabDistance(cell.color, target));
    const best = Math.min(...distances);
    const matches = cells.filter((_, index) => distances[index] <= best + LOCATION_TOLERANCE).map((cell) => cell.center);
    return nearestTo(middleOf(matches), matches);
  });
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
