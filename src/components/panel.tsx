import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  description?: React.ReactNode;
  /** Shown below the heading. */
  action?: React.ReactNode;
  /** Puts the content below the heading at full width, for tables that need the room. */
  wide?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** A section of an analysis tab: heading in the first column, content beside it, a hairline above. No box. */
export function Panel({ title, description, action, wide = false, children, className }: PanelProps) {
  return (
    <section className={cn("grid gap-x-8 gap-y-4 border-t border-border py-7 md:grid-cols-4", className)}>
      <header className={cn("space-y-1.5", wide ? "md:col-span-4" : "md:col-span-1")}>
        <h3 className="font-display text-[1.35rem] leading-tight">{title}</h3>
        {description && <p className={cn("text-sm text-muted-foreground", wide && "max-w-prose")}>{description}</p>}
        {action}
      </header>
      <div className={cn("min-w-0", wide ? "md:col-span-4" : "md:col-span-3")}>{children}</div>
    </section>
  );
}

/** One line of settings: a small label in capitals in the first column, the control beside it. */
export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid items-center gap-x-8 gap-y-2 border-t border-border py-3.5 md:grid-cols-4", className)}>
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase md:col-span-1">{label}</span>
      <div className="min-w-0 md:col-span-3">{children}</div>
    </div>
  );
}
