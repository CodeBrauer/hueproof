import { PaletteApp } from "@/components/palette-app";
import { SiteInfo } from "@/components/site-info";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALE_PATHS, type Locale } from "@/i18n/locales";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** The one page of the site, rendered once per language. */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: `${SITE_URL}${LOCALE_PATHS[locale]}`,
    description: t.meta.description,
    inLanguage: locale,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-4 sm:px-8">
        <main className="flex flex-1 flex-col">
          <PaletteApp />
          <SiteInfo locale={locale} />
        </main>
        <footer className="border-t border-border py-5 text-xs text-muted-foreground">{t.info.footer}</footer>
      </div>
    </>
  );
}
