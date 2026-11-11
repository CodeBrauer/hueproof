import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALE_PATHS, LOCALES, type Locale } from "@/i18n/locales";
import { SITE_NAME, SITE_URL } from "./site";

/** Page metadata for one language, including links to the other language for search engines. */
export function buildMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    applicationName: SITE_NAME,
    keywords: meta.keywords,
    alternates: {
      // Shared palettes differ only in their query string; they all describe this one page.
      canonical: LOCALE_PATHS[locale],
      languages: {
        ...Object.fromEntries(LOCALES.map((other) => [other, LOCALE_PATHS[other]])),
        "x-default": LOCALE_PATHS.en,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      url: LOCALE_PATHS[locale],
      locale: locale === "de" ? "de_DE" : "en_US",
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  };
}
