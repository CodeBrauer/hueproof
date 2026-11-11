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

/** The first supported language in a browser's list (`navigator.languages`), or null when it names none. */
export function preferredLocale(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const primary = tag.trim().toLowerCase().split("-")[0];
    const match = LOCALES.find((locale) => locale === primary);
    if (match) return match;
  }
  return null;
}

const LOCALE_CHOICE_KEY = "hueproof:locale";

/** The language picked with the language switch, if any. Stored data is untrusted, so it is checked. */
export function readLocaleChoice(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_CHOICE_KEY);
    return LOCALES.find((locale) => locale === stored) ?? null;
  } catch {
    return null;
  }
}

export function writeLocaleChoice(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_CHOICE_KEY, locale);
  } catch {
    // Without storage the choice only lasts for this page; the browser language decides next time.
  }
}
