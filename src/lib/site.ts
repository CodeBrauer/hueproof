// No imports on purpose: the Open Graph image script runs this file directly in Node.

export const SITE_NAME = "Hueproof";
/** Short description per language, shown below the name on the link preview image. */
export const SITE_TAGLINES = {
  en: "Accessible color palette generator & contrast checker",
  de: "Barrierefreie Farbpaletten erstellen & Kontrast prüfen",
} as const;
/** Public address of the deployed site; needed for absolute Open Graph image links. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
