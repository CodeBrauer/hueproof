import type { Pixels } from "./color/image";

/** Longer side, in pixels, of the copy that colors are read from: enough to aim at small details, few pixels to analyze. Heuristic. */
export const MAX_IMAGE_SIDE = 512;

const IMAGE_TYPE_PREFIX = "image/";

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

/** The first file that says it is an image. Whether it really is one shows when it is decoded. */
export function firstImageFile(files: Iterable<File>): File | null {
  for (const file of files) {
    if (file.type.startsWith(IMAGE_TYPE_PREFIX)) return file;
  }
  return null;
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
