import { MAX_NAME_LENGTH } from "./types";

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns lowercase `#rrggbb`, or null when the input is not a 3- or 6-digit hex color. */
export function normalizeHex(input: string): string | null {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match) return null;
  const digits = match[1].toLowerCase();
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;
  return `#${full}`;
}

/** `#d5ac85` -> `D5AC85`, the way hex codes are shown in the UI. */
export function displayHex(hex: string): string {
  return hex.slice(1).toUpperCase();
}

/** Names travel comma-separated in the URL, so commas are not allowed inside them. */
export function sanitizeName(input: string): string {
  return input.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export function createId(): string {
  return crypto.randomUUID();
}
