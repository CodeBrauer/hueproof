"use client";

import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/context";
import type { LightnessFix } from "@/lib/color/fix";
import { displayHex } from "@/lib/color/hex";
import { paletteActions } from "@/lib/palette-store";

interface FixButtonProps {
  colorId: string;
  label: string;
  hex: string;
  fix: LightnessFix;
}

/** One suggested lightness change: shows the old and the new color, applies it on click and offers to undo it. */
export function FixButton({ colorId, label, hex, fix }: FixButtonProps) {
  const t = useT();
  const newHex = `#${displayHex(fix.hex)}`;

  function apply() {
    paletteActions.replaceHex(colorId, fix.hex);
    toast.success(t.fix.changed(label, newHex), {
      action: { label: t.common.undo, onClick: paletteActions.undo },
    });
  }

  return (
    <Button variant="outline" size="sm" className="h-auto min-h-8 justify-start gap-2 py-1.5 font-medium tracking-normal normal-case" onClick={apply}>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="size-4 rounded-[3px] ring-1 ring-foreground/20" style={{ backgroundColor: hex }} />
        <ArrowRight className="size-3 text-muted-foreground" />
        <span className="size-4 rounded-[3px] ring-1 ring-foreground/20" style={{ backgroundColor: fix.hex }} />
      </span>
      <span className="truncate">{fix.deltaL > 0 ? t.fix.lighten(label) : t.fix.darken(label)}</span>
      <span className="tabular-nums text-muted-foreground">{newHex}</span>
    </Button>
  );
}
