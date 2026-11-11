"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/i18n/context";
import type { Locale } from "@/i18n/locales";

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster position="bottom-center" />
      </ThemeProvider>
    </LocaleProvider>
  );
}
