import { displayFont, textFont } from "@/app/fonts";
import { Providers } from "@/components/providers";
import type { Locale } from "@/i18n/locales";
import "@/app/globals.css";

/** The document shell shared by the root layouts of both languages. */
export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    // next-themes sets the theme class before hydration, which React would otherwise report as a mismatch.
    <html
      lang={locale}
      className={`${displayFont.variable} ${textFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
