export interface PaletteColor {
  id: string;
  /** Lowercase `#rrggbb`. */
  hex: string;
  /** Name chosen by the user. Empty means "show the suggested name". */
  name: string;
  locked: boolean;
}

export type PaletteEntry = Pick<PaletteColor, "hex" | "name">;

export const MIN_COLORS = 2;
export const MAX_COLORS = 10;
export const MAX_NAME_LENGTH = 40;

export const DEFAULT_PALETTE: PaletteEntry[] = [
  { hex: "#d5ac85", name: "gold" },
  { hex: "#f5e9d9", name: "weiß" },
  { hex: "#132c29", name: "emerald" },
  { hex: "#751729", name: "rot" },
  { hex: "#7a8f6e", name: "mint" },
];
