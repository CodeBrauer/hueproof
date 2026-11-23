import type { ImagePoint, Pixels } from "./color/image";

/** Longer side, in pixels, of the copy that colors are read from: enough to aim at small details, few pixels to analyze. Heuristic. */
export const MAX_IMAGE_SIDE = 512;

const IMAGE_TYPE_PREFIX = "image/";
/** Some systems hand over image files without a type, or as `application/octet-stream`; then the extension decides. */
const IMAGE_EXTENSIONS = new Set(["avif", "bmp", "gif", "heic", "heif", "jpeg", "jpg", "jxl", "png", "tif", "tiff", "webp"]);
/** HEIC and HEIF, the format of iPhone photos, which browsers other than Safari cannot show. */
const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).trim().toLowerCase();
}

export interface LoadedImage {
  /** Object URL of the file, to show it. Revoke it once the image is no longer shown. */
  url: string;
  pixels: Pixels;
}

/** Scales a size down until its longer side is at most `maxSide`. Smaller sizes stay; no side drops below one pixel. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** The first file that looks like an image, by its type or its extension. Whether it really is one shows when it is decoded. */
export function firstImageFile(files: Iterable<File>): File | null {
  for (const file of files) {
    if (file.type.startsWith(IMAGE_TYPE_PREFIX) || IMAGE_EXTENSIONS.has(extensionOf(file.name))) return file;
  }
  return null;
}

/** Whether a file is a HEIC or HEIF photo, so a failed decoding can say why. */
export function isHeic(file: File): boolean {
  return HEIC_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSIONS.has(extensionOf(file.name));
}

/** A color of the selection taken from an image, and the point it comes from, if known. */
export interface SelectedColor {
  id: string;
  hex: string;
  point: ImagePoint | null;
}

/** What was changed on top of the dominant colors: colors moved to another point or taken out (by id), and colors picked. */
export interface SelectionEdits {
  moved: Readonly<Record<string, SelectedColor>>;
  removed: readonly string[];
  picked: readonly SelectedColor[];
}

export const NO_EDITS: SelectionEdits = { moved: {}, removed: [], picked: [] };

/**
 * The selection: the dominant colors where they sit, or where they were moved to, then the picked colors, without the
 * ones taken out. A moved color keeps its place, so its number on the image stays the same.
 */
export function selectionFrom(
  dominant: readonly string[],
  locations: readonly (ImagePoint | null)[],
  edits: SelectionEdits,
): SelectedColor[] {
  const fromImage = dominant.map((hex, index) => {
    const id = `dominant-${index}`;
    return edits.moved[id] ?? { id, hex, point: locations[index] ?? null };
  });
  return [...fromImage, ...edits.picked].filter((color) => !edits.removed.includes(color.id));
}

/** Puts a color of the selection at a new point, with the color found there. */
export function moveInSelection(edits: SelectionEdits, color: SelectedColor): SelectionEdits {
  if (edits.picked.some((pick) => pick.id === color.id)) {
    return { ...edits, picked: edits.picked.map((pick) => (pick.id === color.id ? color : pick)) };
  }
  return { ...edits, moved: { ...edits.moved, [color.id]: color } };
}

/** Takes a color out of the selection. A picked color is dropped and frees its place for another. */
export function removeFromSelection(edits: SelectionEdits, id: string): SelectionEdits {
  if (edits.picked.some((pick) => pick.id === id)) {
    return { ...edits, picked: edits.picked.filter((pick) => pick.id !== id) };
  }
  return { ...edits, removed: [...edits.removed, id] };
}

/**
 * Decodes an image file in the browser and reads its pixels, scaled down to `MAX_IMAGE_SIDE`.
 * The same element is shown and read, so both follow the rotation stored in a photo. Nothing is uploaded.
 */
export async function readImage(file: File): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("The image has no size");
    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, MAX_IMAGE_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);
    return { url, pixels: context.getImageData(0, 0, width, height) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
