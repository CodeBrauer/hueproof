import { ExternalLink } from "lucide-react";
import type { Reference } from "@/lib/references";

export function SourceLink({ reference }: { reference: Reference }) {
  return (
    <a
      href={reference.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
    >
      {reference.label}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}
