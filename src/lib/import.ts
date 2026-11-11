import { normalizeHex, sanitizeName } from "./color/hex";
import { parsePalette } from "./color/url";
import { MAX_COLORS, type PaletteEntry } from "./color/types";

/** `#rgb`, `#rrggbb` or `#rrggbbaa`; the alpha part is ignored. */
const HASH_HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-f])/gi;
/** Six hex digits without `#`, as in `d5ac85, f5e9d9` or `…/985f99-9684a1`. */
const BARE_HEX = /(?<![0-9a-z#])[0-9a-f]{6}(?![0-9a-z])/gi;
const INDEXED_COLOR_PARAM = /^color(\d+)$/;
const HEX_WITH_ALPHA_LENGTH = 9;

function partAfter(text: string, marker: string): string | null {
  const start = text.indexOf(marker);
  return start === -1 ? null : text.slice(start + 1);
}

/** Links that carry `color0=…&name0=…` parameters, as some palette testers produce. */
function parseIndexedParams(query: string): PaletteEntry[] {
  const params = new URLSearchParams(query.split("#")[0]);
  const colors: PaletteEntry[] = [];
  for (const [key, value] of params) {
    const match = INDEXED_COLOR_PARAM.exec(key);
    const hex = match ? normalizeHex(value) : null;
    if (match && hex) colors.push({ hex, name: sanitizeName(params.get(`name${match[1]}`) ?? "") });
  }
  return colors;
}

function toHex(token: string): string | null {
  return normalizeHex(token.length === HEX_WITH_ALPHA_LENGTH ? token.slice(0, 7) : token);
}

/** `gold: #D5AC85`, `--gold: #d5ac85;` or `#d5ac85 gold` -> `gold`. */
function nameFromLine(line: string, hexToken: string): string {
  const rest = line
    .replace(hexToken, " ")
    .replace(/^[\s\-$@]+/, "")
    .replace(/[:;=,"'`{}()]/g, " ");
  return sanitizeName(rest);
}

/** Colors line by line. A line may hold several hex codes, separated by commas, spaces or anything else. */
function parseLines(text: string): PaletteEntry[] {
  const colors: PaletteEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.match(HASH_HEX) ?? line.match(BARE_HEX) ?? [];
    for (const token of tokens) {
      const hex = toHex(token);
      // A name is only unambiguous when the line holds a single color.
      if (hex) colors.push({ hex, name: tokens.length === 1 ? nameFromLine(line, token) : "" });
    }
  }
  return colors;
}

/**
 * Reads colors from pasted text: a link from this tool, hex codes separated by commas,
 * spaces or line breaks (with or without `#`), `name: #hex` lines, CSS, or a Coolors-style
 * link (`…/985f99-9684a1-aaacb0`).
 */
export function parseImportText(text: string): PaletteEntry[] {
  const trimmed = text.trim();

  const fragment = partAfter(trimmed, "#");
  const fromFragment = fragment === null ? null : parsePalette(fragment);
  if (fromFragment) return fromFragment;

  const query = partAfter(trimmed, "?");
  if (query !== null) {
    const legacy = parsePalette(query.split("#")[0]);
    if (legacy) return legacy;
    const indexed = parseIndexedParams(query);
    if (indexed.length > 0) return indexed.slice(0, MAX_COLORS);
  }

  return parseLines(trimmed).slice(0, MAX_COLORS);
}
