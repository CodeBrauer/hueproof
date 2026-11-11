import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALE_PATHS, LOCALES, type Locale } from "@/i18n/locales";
import { BASE_PATH, OG_IMAGE_SIZE, ogImagePath, SITE_NAME, SITE_ORIGIN } from "./site";

/** Page metadata for one language, including links to the other language for search engines. */
export function buildMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);
  // Next does not prefix these links with the base path.
  const path = (target: Locale) => `${BASE_PATH}${LOCALE_PATHS[target]}`;
  // A static file instead of a file-based `opengraph-image`: with a base path, Next 16.4 links a different
  // hashed file name than the one it writes to `out/`, so the preview image was a 404.
  const image = { url: `${BASE_PATH}${ogImagePath(locale)}`, ...OG_IMAGE_SIZE, alt: meta.imageAlt, type: "image/png" };
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
      images: [image],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: [image] },
  };
}
