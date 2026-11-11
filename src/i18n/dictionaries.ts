import { de } from "./de";
import { en, type Dictionary } from "./en";
import type { Locale } from "./locales";

const DICTIONARIES: Record<Locale, Dictionary> = { en, de };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
