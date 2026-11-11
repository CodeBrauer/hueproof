"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSavedPalettes } from "@/hooks/use-saved-palettes";
import { useLocale, useT } from "@/i18n/context";
import type { PaletteEntry } from "@/lib/color/types";
import { paletteActions } from "@/lib/palette-store";
import { MAX_TITLE_LENGTH, type SavedPalette } from "@/lib/storage";

interface LibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The palette currently being edited. */
  colors: PaletteEntry[];
}

export function LibraryDialog({ open, onOpenChange, colors }: LibraryDialogProps) {
  const t = useT();
  const locale = useLocale();
  const { palettes, save, remove, restore } = useSavedPalettes();
  const [title, setTitle] = useState("");

  function saveCurrent(event: React.FormEvent) {
    event.preventDefault();
    if (save(title, colors)) {
      toast.success(t.library.saved);
      setTitle("");
    } else {
      toast.error(t.library.storageError);
    }
  }

  function load(palette: SavedPalette) {
    paletteActions.replaceAll(palette.colors);
    toast.success(t.library.loaded(palette.title || t.library.untitled), {
      action: { label: t.common.undo, onClick: paletteActions.undo },
    });
    onOpenChange(false);
  }

  function deletePalette(palette: SavedPalette) {
    if (!remove(palette.id)) {
      toast.error(t.library.storageError);
      return;
    }
    toast.success(t.library.deleted(palette.title || t.library.untitled), {
      action: { label: t.common.undo, onClick: () => restore(palette) },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t.library.title}</DialogTitle>
          <DialogDescription>{t.library.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={saveCurrent} className="flex gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            placeholder={t.library.namePlaceholder}
            aria-label={t.library.nameLabel}
          />
          <Button type="submit">{t.library.save}</Button>
        </form>

        {palettes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t.library.empty}</p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto border-y border-border">
            {palettes.map((palette) => (
              <li key={palette.id} className="flex items-center gap-2 py-2.5">
                <button
                  type="button"
                  onClick={() => load(palette)}
                  className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex h-7 w-full overflow-hidden rounded-md ring-1 ring-foreground/10" aria-hidden="true">
                    {palette.colors.map((color, index) => (
                      <span key={index} className="flex-1" style={{ backgroundColor: color.hex }} />
                    ))}
                  </span>
                  <span className="flex w-full justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{palette.title || t.library.untitled}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(palette.savedAt).toLocaleDateString(locale, { dateStyle: "medium" })}
                    </span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.library.remove(palette.title || t.library.untitled)}
                  onClick={() => deletePalette(palette)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
