import { normalizeHex, sanitizeName } from "./hex";
import { MAX_COLORS, MIN_COLORS, type PaletteEntry } from "./types";

const NAMES_PARAM = "n";
/** Links from before the palette moved into the fragment carried it as `?c=…&n=…`. */
const LEGACY_COLORS_PARAM = "c";
const COLOR_SEPARATOR = "-";
const NAME_SEPARATOR = ",";

/**
 * The part of the link after `#`: `d5ac85-f5e9d9&n=gold,wei%C3%9F`.
 * Names are only written when at least one is set.
 */
export function serializePalette(colors: PaletteEntry[]): string {
  const hexes = colors.map((color) => color.hex.slice(1)).join(COLOR_SEPARATOR);
  if (!colors.some((color) => color.name)) return hexes;
  // Names are encoded one by one so the separating commas stay readable in the link.
  const names = colors.map((color) => encodeURIComponent(color.name)).join(NAME_SEPARATOR);
  return `${hexes}&${NAMES_PARAM}=${names}`;
}

/**
 * Reads a palette from a URL fragment (with or without `#`) or from a legacy query string.
 * Invalid hex codes are dropped; returns null when fewer than MIN_COLORS valid colors remain.
 */
export function parsePalette(fragment: string): PaletteEntry[] | null {
  const raw = fragment.replace(/^[#?]/, "");
  const legacy = new URLSearchParams(raw);
  let rawColors: string;
  let params: URLSearchParams;
  if (legacy.has(LEGACY_COLORS_PARAM)) {
    rawColors = legacy.get(LEGACY_COLORS_PARAM) ?? "";
    params = legacy;
  } else {
    const separator = raw.indexOf("&");
    rawColors = separator === -1 ? raw : raw.slice(0, separator);
    params = new URLSearchParams(separator === -1 ? "" : raw.slice(separator + 1));
  }
  if (!rawColors) return null;
  const names = (params.get(NAMES_PARAM) ?? "").split(NAME_SEPARATOR);

  const colors: PaletteEntry[] = [];
  rawColors.split(COLOR_SEPARATOR).forEach((part, index) => {
    const hex = normalizeHex(part);
    if (hex) colors.push({ hex, name: sanitizeName(names[index] ?? "") });
  });

  if (colors.length < MIN_COLORS) return null;
  return colors.slice(0, MAX_COLORS);
}
