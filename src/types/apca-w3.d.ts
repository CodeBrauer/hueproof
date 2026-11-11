declare module "apca-w3" {
  /** Luminance (Y) of an sRGB color given as 8-bit `[r, g, b]`. */
  export function sRGBtoY(rgb: [number, number, number]): number;
  /** APCA lightness contrast (Lc). Positive for dark text on light, negative for the reverse. */
  export function APCAcontrast(textY: number, backgroundY: number, places?: number): number;
}
