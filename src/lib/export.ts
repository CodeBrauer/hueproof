import { converter } from "culori";
import { renderPaletteSvg } from "./palette-image";

export interface ExportColor {
  name: string;
  hex: string;
}

export interface ExportFormat {
  id: string;
  label: string;
  filename: string;
  mimeType: string;
  build: (colors: ExportColor[]) => string;
}

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toOklch = converter("oklch");

function round(value: number | undefined, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value ?? 0) * factor) / factor + 0;
}

/** `Weiß 2` -> `weiss-2`, `Nymph’s Delight` -> `nymphs-delight`. Falls back to `color-N` and never starts with a digit, so it is a valid CSS identifier. */
export function toSlug(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/['’]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return `color-${index + 1}`;
  return /^[0-9]/.test(slug) ? `color-${slug}` : slug;
}

/** Slugs for all colors, with `-2`, `-3` … appended to duplicates. */
export function uniqueSlugs(colors: ExportColor[]): string[] {
  const seen = new Map<string, number>();
  return colors.map((color, index) => {
    const slug = toSlug(color.name, index);
    const count = (seen.get(slug) ?? 0) + 1;
    seen.set(slug, count);
    return count === 1 ? slug : `${slug}-${count}`;
  });
}

function lines(colors: ExportColor[], line: (slug: string, color: ExportColor) => string): string {
  const slugs = uniqueSlugs(colors);
  return colors.map((color, index) => line(slugs[index], color)).join("\n");
}

function buildJson(colors: ExportColor[]): string {
  const slugs = uniqueSlugs(colors);
  const entries = colors.map((color, index) => {
    const rgb = toRgb(color.hex)!;
    const hsl = toHsl(color.hex)!;
    const oklch = toOklch(color.hex)!;
    return {
      name: color.name,
      slug: slugs[index],
      hex: color.hex,
      rgb: [round(rgb.r * 255, 0), round(rgb.g * 255, 0), round(rgb.b * 255, 0)],
      hsl: [round(hsl.h, 0), round(hsl.s * 100, 0), round(hsl.l * 100, 0)],
      oklch: [round(oklch.l, 3), round(oklch.c, 3), round(oklch.h, 1)],
    };
  });
  return JSON.stringify(entries, null, 2);
}

function buildTokens(colors: ExportColor[]): string {
  const slugs = uniqueSlugs(colors);
  const tokens = Object.fromEntries(
    colors.map((color, index) => {
      const rgb = toRgb(color.hex)!;
      return [
        slugs[index],
        {
          $type: "color",
          $value: {
            colorSpace: "srgb",
            components: [round(rgb.r, 4), round(rgb.g, 4), round(rgb.b, 4)],
            hex: color.hex,
          },
          $description: color.name,
        },
      ];
    }),
  );
  return JSON.stringify({ color: tokens }, null, 2);
}

export const EXPORT_FORMATS: readonly ExportFormat[] = [
  {
    id: "css",
    label: "CSS",
    filename: "palette.css",
    mimeType: "text/css",
    build: (colors) => `:root {\n${lines(colors, (slug, color) => `  --${slug}: ${color.hex};`)}\n}`,
  },
  {
    id: "scss",
    label: "SCSS",
    filename: "_palette.scss",
    mimeType: "text/x-scss",
    build: (colors) => lines(colors, (slug, color) => `$${slug}: ${color.hex};`),
  },
  {
    id: "tailwind",
    label: "Tailwind",
    filename: "theme.css",
    mimeType: "text/css",
    build: (colors) => `@theme {\n${lines(colors, (slug, color) => `  --color-${slug}: ${color.hex};`)}\n}`,
  },
  { id: "json", label: "JSON", filename: "palette.json", mimeType: "application/json", build: buildJson },
  {
    id: "tokens",
    label: "Design Tokens",
    filename: "palette.tokens.json",
    mimeType: "application/json",
    build: buildTokens,
  },
  {
    id: "svg",
    label: "SVG",
    filename: "palette.svg",
    mimeType: "image/svg+xml",
    build: (colors) => renderPaletteSvg(colors),
  },
];
