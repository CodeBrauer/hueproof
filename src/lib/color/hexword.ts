import { HEX_WORDS } from "../../data/hex-words";
import { isFullHex } from "./hex";

/**
 * The English word a six-digit hex code spells in leetspeak (`#c0ffee` -> `coffee`), or null.
 * Exact matches only. Three-digit shorthands never count: `#bad` expands to `#bbaadd`, which spells nothing.
 */
export function hexWord(input: string): string | null {
  const code = input.trim();
  if (!isFullHex(code)) return null;
  const key = code.replace("#", "").toLowerCase();
  return Object.hasOwn(HEX_WORDS, key) ? HEX_WORDS[key] : null;
}
