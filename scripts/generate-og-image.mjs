// Renders the app icon and the link preview images (Open Graph), one per language, from the default palette.
// Run with `pnpm og-image` after changing the default palette, the site name or a tagline.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { DEFAULT_PALETTE } from "../src/lib/color/types.ts";
import { renderIconSvg, renderPaletteSvg } from "../src/lib/palette-image.ts";
import { SITE_NAME, SITE_TAGLINES } from "../src/lib/site.ts";

/** Folder of each language's page inside `src/app`. */
const TARGETS = { en: "(en)", de: "(de)/de" };
const appFile = (path) => fileURLToPath(new URL(`../src/app/${path}`, import.meta.url));

writeFileSync(appFile("icon.svg"), `${renderIconSvg(DEFAULT_PALETTE.map((color) => color.hex))}\n`);
console.log("icon: written");

for (const [locale, folder] of Object.entries(TARGETS)) {
  const svg = renderPaletteSvg(DEFAULT_PALETTE, { caption: { title: SITE_NAME, subtitle: SITE_TAGLINES[locale] } });
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  writeFileSync(appFile(`${folder}/opengraph-image.png`), png);
  console.log(`${locale}: wrote ${png.length} bytes`);
}
