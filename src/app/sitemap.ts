import type { MetadataRoute } from "next";
import { LOCALE_PATHS, LOCALES } from "@/i18n/locales";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((locale) => [locale, `${SITE_URL}${LOCALE_PATHS[locale]}`]));
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}${LOCALE_PATHS[locale]}`,
    changeFrequency: "monthly",
    priority: locale === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
}
