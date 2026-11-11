import { normalizeHex, sanitizeName } from "./color/hex";
import type { PaletteEntry } from "./color/types";

const STORAGE_KEY = "hueproof:saved-palettes:v1";
const MAX_TITLE_LENGTH = 60;

export interface SavedPalette {
  id: string;
  title: string;
  colors: PaletteEntry[];
  savedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Stored data may be stale or hand-edited, so every entry is validated before use. */
function toSavedPalette(value: unknown): SavedPalette | null {
  if (!isRecord(value) || typeof value.id !== "string" || !Array.isArray(value.colors)) return null;
  const colors = value.colors.flatMap((color): PaletteEntry[] => {
    if (!isRecord(color) || typeof color.hex !== "string") return [];
    const hex = normalizeHex(color.hex);
    return hex ? [{ hex, name: sanitizeName(typeof color.name === "string" ? color.name : "") }] : [];
  });
  if (colors.length === 0) return null;
  return {
    id: value.id,
    title: typeof value.title === "string" ? value.title.slice(0, MAX_TITLE_LENGTH) : "",
    colors,
    savedAt: typeof value.savedAt === "number" ? value.savedAt : 0,
  };
}

export function readSavedPalettes(): SavedPalette[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => toSavedPalette(entry) ?? []);
  } catch {
    return [];
  }
}

/** Returns false when the browser refuses to store (private mode, quota). */
export function writeSavedPalettes(palettes: SavedPalette[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
    return true;
  } catch {
    return false;
  }
}

export { MAX_TITLE_LENGTH };
