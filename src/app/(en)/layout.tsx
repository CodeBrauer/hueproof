import { BrowserLanguageRedirect } from "@/components/browser-language-redirect";
import { SiteShell } from "@/components/site-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("en");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell locale="en">
      <BrowserLanguageRedirect />
      {children}
    </SiteShell>
  );
}
