"use client";

import { cn } from "@/lib/utils";

interface SegmentedProps<Value extends string> {
  /** Accessible name of the group. */
  label: string;
  value: Value;
  onChange: (value: Value) => void;
  options: readonly { value: Value; label: React.ReactNode }[];
  size?: "sm" | "md";
  className?: string;
}

/** Mutually exclusive choices as plain words: the selected one is dark and underlined, the others quiet. */
export function Segmented<Value extends string>({
  label,
  value,
  onChange,
  options,
  size = "md",
  className,
}: SegmentedProps<Value>) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-x-5 gap-y-1.5", className)}>
      {options.map((option) => (
        <Choice key={option.value} size={size} pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </Choice>
      ))}
    </div>
  );
}

/** A single on/off choice in the same style. */
export function Choice({
  pressed,
  size = "md",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { pressed: boolean; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "rounded-sm font-semibold whitespace-nowrap underline-offset-[5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        size === "md" ? "text-sm" : "text-[13px]",
        pressed ? "text-foreground underline decoration-2" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
