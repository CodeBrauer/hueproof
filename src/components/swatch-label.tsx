import { cn } from "@/lib/utils";

/** A small color square followed by a label, used wherever a palette color is referred to in text. */
export function SwatchLabel({ hex, children, className }: { hex: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span
        className="size-3 shrink-0 rounded-[3px] ring-1 ring-foreground/15"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <span className="truncate">{children}</span>
    </span>
  );
}
