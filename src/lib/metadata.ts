import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALE_PATHS, LOCALES, type Locale } from "@/i18n/locales";
import { BASE_PATH, SITE_NAME, SITE_ORIGIN } from "./site";

/** Page metadata for one language, including links to the other language for search engines. */
export function buildMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);
  // Next prefixes file-based images (the Open Graph image) with the base path itself, but not these links.
  const path = (target: Locale) => `${BASE_PATH}${LOCALE_PATHS[target]}`;
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: meta.title,
    description: meta.description,
    applicationName: SITE_NAME,
    keywords: meta.keywords,
    alternates: {
      // Shared palettes differ only in their query string; they all describe this one page.
      canonical: path(locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((other) => [other, path(other)])),
        "x-default": path("en"),
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      url: path(locale),
      locale: locale === "de" ? "de_DE" : "en_US",
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  };
}
