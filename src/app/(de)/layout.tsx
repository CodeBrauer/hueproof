import { SiteShell } from "@/components/site-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("de");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="de">{children}</SiteShell>;
}
