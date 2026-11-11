// No imports on purpose: the Open Graph image script runs this file directly in Node.

export const SITE_NAME = "Hueproof";
/** Short description per language, shown below the name on the link preview image. */
export const SITE_TAGLINES = {
  en: "Accessible color palette generator & contrast checker",
  de: "Barrierefreie Farbpaletten erstellen & Kontrast prüfen",
} as const;
/** Size of the link preview image in pixels, the size Open Graph consumers recommend. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
/** Path of a language's link preview image inside `public/`, which is also its URL below the base path. */
export const ogImagePath = (locale: keyof typeof SITE_TAGLINES) => `/og/${locale}.png`;
/**
 * Public address of the deployed site without a trailing slash; needed for absolute Open Graph image links.
 * It may include a path (https://tools.codebrauer.com/hueproof) when the site does not sit at the root of its domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
/** Scheme and host of `SITE_URL`. */
export const SITE_ORIGIN = new URL(SITE_URL).origin;
/** Path part of `SITE_URL`, e.g. "/hueproof", or "" at the domain root. Becomes Next's `basePath`. */
export const BASE_PATH = new URL(SITE_URL).pathname.replace(/\/+$/, "");
