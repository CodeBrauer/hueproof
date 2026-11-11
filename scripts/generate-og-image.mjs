// Renders the app icon and the link preview images (Open Graph), one per language, from the default palette.
// Run with `pnpm og-image` after changing the default palette, the site name or a tagline.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { DEFAULT_PALETTE } from "../src/lib/color/types.ts";
import { renderIconSvg, renderPaletteSvg } from "../src/lib/palette-image.ts";
import { OG_IMAGE_SIZE, ogImagePath, SITE_NAME, SITE_TAGLINES } from "../src/lib/site.ts";

const repoFile = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

writeFileSync(repoFile("src/app/icon.svg"), `${renderIconSvg(DEFAULT_PALETTE.map((color) => color.hex))}\n`);
console.log("icon: written");

for (const [locale, subtitle] of Object.entries(SITE_TAGLINES)) {
  const svg = renderPaletteSvg(DEFAULT_PALETTE, { ...OG_IMAGE_SIZE, caption: { title: SITE_NAME, subtitle } });
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  writeFileSync(repoFile(`public${ogImagePath(locale)}`), png);
  console.log(`${locale}: wrote ${png.length} bytes`);
}
