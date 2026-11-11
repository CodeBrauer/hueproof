// No imports on purpose: the Open Graph image script runs this file directly in Node.

export interface ImageSwatch {
  hex: string;
  name: string;
}

export interface PaletteImageOptions {
  width?: number;
  height?: number;
  /** Adds a white band below the swatches with a title and a subtitle. */
  caption?: { title: string; subtitle: string };
}

const CAPTION_HEIGHT = 170;
const DARK_TEXT = "#111111";
const LIGHT_TEXT = "#ffffff";

// The logo: a ring made of the palette's colors with a check mark inside, on a 32 × 32 grid.
const LOGO_CENTER = 16;
const LOGO_RADIUS = 11;
const LOGO_GAP_DEGREES = 12;
export const LOGO_RING_WIDTH = 6.5;
export const LOGO_CHECK_PATH = "M11 16.6l3.5 3.5 6.6-7.4";
export const LOGO_CHECK_WIDTH = 3.2;

function pointOnRing(degrees: number): string {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = LOGO_CENTER + LOGO_RADIUS * Math.cos(radians);
  const y = LOGO_CENTER + LOGO_RADIUS * Math.sin(radians);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

/** One arc path per color: equal segments of a ring, separated by small gaps, starting at the top. */
export function logoArcs(count: number): string[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, index) => {
    const start = index * step + LOGO_GAP_DEGREES / 2;
    const end = (index + 1) * step - LOGO_GAP_DEGREES / 2;
    const largeArc = end - start > 180 ? 1 : 0;
    return `M${pointOnRing(start)}A${LOGO_RADIUS} ${LOGO_RADIUS} 0 ${largeArc} 1 ${pointOnRing(end)}`;
  });
}

/** The logo as SVG markup without the outer `<svg>` element, for the icon file and the preview image. */
export function renderLogoMark(colors: string[], checkColor: string): string {
  const ring = logoArcs(colors.length)
    .map((path, index) => `<path d="${path}" fill="none" stroke="${colors[index]}" stroke-width="${LOGO_RING_WIDTH}"/>`)
    .join("");
  return `${ring}<path d="${LOGO_CHECK_PATH}" fill="none" stroke="${checkColor}" stroke-width="${LOGO_CHECK_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** The app icon: the logo on a dark rounded tile, so it stays visible on light and dark browser tabs. */
export function renderIconSvg(colors: string[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${DARK_TEXT}"/><g transform="translate(3.2 3.2) scale(0.8)">${renderLogoMark(colors, LIGHT_TEXT)}</g></svg>`;
}
const LABEL_FONT = "Helvetica, Arial, sans-serif";

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function textColorOn(hex: string): string {
  const luminance = relativeLuminance(hex);
  // Same comparison as a WCAG contrast check against black and white.
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? DARK_TEXT : LIGHT_TEXT;
}

/** The palette as vertical stripes with hex code and name, as an SVG document. */
export function renderPaletteSvg(swatches: ImageSwatch[], options: PaletteImageOptions = {}): string {
  const { width = 1200, height = 630, caption } = options;
  const stripeHeight = caption ? height - CAPTION_HEIGHT : height;
  const stripeWidth = width / swatches.length;
  const hexSize = Math.min(40, stripeWidth / 5.5);
  const nameSize = hexSize * 0.5;

  const stripes = swatches
    .map((swatch, index) => {
      const x = index * stripeWidth;
      const center = x + stripeWidth / 2;
      const fill = textColorOn(swatch.hex);
      return [
        `<rect x="${x}" y="0" width="${stripeWidth + 1}" height="${stripeHeight}" fill="${swatch.hex}"/>`,
        `<text x="${center}" y="${stripeHeight - nameSize * 3.4}" text-anchor="middle" font-family="${LABEL_FONT}" font-size="${hexSize}" font-weight="700" fill="${fill}">${swatch.hex.slice(1).toUpperCase()}</text>`,
        `<text x="${center}" y="${stripeHeight - nameSize * 1.5}" text-anchor="middle" font-family="${LABEL_FONT}" font-size="${nameSize}" fill="${fill}" fill-opacity="0.8">${escapeXml(swatch.name)}</text>`,
      ].join("");
    })
    .join("");

  const captionMarkup = caption
    ? [
        `<rect x="0" y="${stripeHeight}" width="${width}" height="${CAPTION_HEIGHT}" fill="#ffffff"/>`,
        `<g transform="translate(52 ${stripeHeight + 31}) scale(3.4)">${renderLogoMark(swatches.map((swatch) => swatch.hex), DARK_TEXT)}</g>`,
        `<text x="186" y="${stripeHeight + 86}" font-family="${LABEL_FONT}" font-size="56" font-weight="700" fill="${DARK_TEXT}">${escapeXml(caption.title)}</text>`,
        `<text x="186" y="${stripeHeight + 130}" font-family="${LABEL_FONT}" font-size="28" fill="#555555">${escapeXml(caption.subtitle)}</text>`,
      ].join("")
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${stripes}${captionMarkup}</svg>`;
}
