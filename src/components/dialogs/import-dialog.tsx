"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SwatchLabel } from "@/components/swatch-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/context";
import { displayHex } from "@/lib/color/hex";
import { MAX_COLORS, MIN_COLORS } from "@/lib/color/types";
import { parseImportText } from "@/lib/import";
import { paletteActions } from "@/lib/palette-store";

const PLACEHOLDER = "gold: #D5AC85\nweiß: #F5E9D9\nemerald: #132C29";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const t = useT();
  const [text, setText] = useState("");
  const parsed = useMemo(() => parseImportText(text), [text]);

  function replacePalette() {
    paletteActions.replaceAll(parsed);
    toast.success(t.importDialog.imported(parsed.length), {
      action: { label: t.common.undo, onClick: paletteActions.undo },
    });
    setText("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t.importDialog.title}</DialogTitle>
          <DialogDescription>{t.importDialog.description(MAX_COLORS)}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={PLACEHOLDER}
          rows={6}
          spellCheck={false}
          aria-label={t.importDialog.inputLabel}
          className="font-mono text-sm"
        />
        {parsed.length > 0 && (
          <div className="space-y-2">
            <div className="flex h-9 overflow-hidden rounded-md ring-1 ring-foreground/10" aria-hidden="true">
              {parsed.map((color, index) => (
                <span key={index} className="flex-1" style={{ backgroundColor: color.hex }} />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {parsed.map((color, index) => (
                <li key={index}>
                  <SwatchLabel hex={color.hex}>{color.name || `#${displayHex(color.hex)}`}</SwatchLabel>
                </li>
              ))}
            </ul>
          </div>
        )}
        {parsed.length === 1 && <p className="text-sm text-muted-foreground">{t.importDialog.needTwo}</p>}
        {text.trim() !== "" && parsed.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.importDialog.noneFound}</p>
        )}
        <DialogFooter>
          <Button disabled={parsed.length < MIN_COLORS} onClick={replacePalette}>
            {t.importDialog.replace}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
