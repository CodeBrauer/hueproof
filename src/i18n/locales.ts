export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

/** Where each language lives. English is the root; paths end with a slash to match the static export. */
export const LOCALE_PATHS: Record<Locale, string> = { en: "/", de: "/de/" };

/** A share between 0 and 1 as a percentage, e.g. "60%" in English and "60 %" in German. */
export function formatPercent(locale: Locale, share: number): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(share);
}

/** Label of the link that switches to a language, written in that language. */
export const SWITCH_LABELS: Record<Locale, string> = { en: "View in English", de: "Auf Deutsch anzeigen" };
