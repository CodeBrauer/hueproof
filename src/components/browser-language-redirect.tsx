"use client";

import { useEffect } from "react";
import { LOCALE_PATHS, preferredLocale, readLocaleChoice } from "@/i18n/locales";
import { BASE_PATH } from "@/lib/site";

/**
 * Sends a first visit to the English root on to the browser's language. A static site cannot do this on the
 * server, and a language picked with the language switch always wins. The palette in the fragment comes along.
 */
export function BrowserLanguageRedirect() {
  useEffect(() => {
    if (readLocaleChoice()) return;
    const locale = preferredLocale(navigator.languages);
    if (locale && locale !== "en") {
      window.location.replace(`${BASE_PATH}${LOCALE_PATHS[locale]}${window.location.hash}`);
    }
  }, []);
  return null;
}
