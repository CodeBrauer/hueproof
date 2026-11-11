"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Dictionary } from "./dictionaries";
import type { Locale } from "./locales";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** The texts of the current language. */
export function useT(): Dictionary {
  return getDictionary(useContext(LocaleContext));
}
