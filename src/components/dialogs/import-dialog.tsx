"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageImport } from "@/components/dialogs/image-import";
import { Segmented } from "@/components/segmented";
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
import { createId, displayHex } from "@/lib/color/hex";
import { colorAt, colorLocations, dominantColors, type ImagePoint } from "@/lib/color/image";
import { DEFAULT_PALETTE, MAX_COLORS, MIN_COLORS, type PaletteEntry } from "@/lib/color/types";
import {
  firstImageFile,
  moveInSelection,
  NO_EDITS,
  readImage,
  removeFromSelection,
  selectionFrom,
  type LoadedImage,
  type SelectedColor,
  type SelectionEdits,
} from "@/lib/image";
import { parseImportText } from "@/lib/import";
import { paletteActions } from "@/lib/palette-store";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "gold: #D5AC85\nweiß: #F5E9D9\nemerald: #132C29";
/** Drag events name this type when they carry files rather than text. */
const FILES_TYPE = "Files";

type ImportSource = "text" | "image";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const t = useT();
  const [source, setSource] = useState<ImportSource>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [count, setCount] = useState(DEFAULT_PALETTE.length);
  // Colors moved, taken out or picked on top of the dominant colors of the image.
  const [edits, setEdits] = useState<SelectionEdits>(NO_EDITS);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseImportText(text), [text]);
  const dominant = useMemo(() => (image ? dominantColors(image.pixels, count) : []), [image, count]);
  const locations = useMemo(() => (image ? colorLocations(image.pixels, dominant) : []), [image, dominant]);
  const selection = useMemo(() => selectionFrom(dominant, locations, edits), [dominant, locations, edits]);
  const colors = source === "text" ? parsed : selection.map(({ hex }) => ({ hex, name: "" }));
  // The dominant colors and the picked ones together never exceed a palette.
  const selectionFull = count + edits.picked.length >= MAX_COLORS;
  const nothingFound =
    source === "text" ? text.trim() !== "" && parsed.length === 0 : image !== null && dominant.length === 0;
  const hasColors = source === "text" ? parsed.length > 0 : image !== null && !nothingFound;
  const tooFew = hasColors && colors.length < MIN_COLORS;

  // The image lives only as long as it is shown: replacing it or closing the dialog frees it.
  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image.url);
  }, [image]);

  function showImage(next: LoadedImage | null) {
    setImage(next);
    setEdits(NO_EDITS);
  }

  function changeOpen(next: boolean) {
    if (!next) showImage(null);
    onOpenChange(next);
  }

  // New dominant colors: changes to the old ones no longer apply, picked colors stay.
  function changeCount(next: number) {
    setCount(next);
    setEdits((current) => ({ ...NO_EDITS, picked: current.picked }));
  }

  function moveColor(color: SelectedColor, point: ImagePoint) {
    // On a transparent spot the marker moves on and keeps its color.
    const hex = (image && colorAt(image.pixels, point)) ?? color.hex;
    setEdits((current) => moveInSelection(current, { ...color, hex, point }));
  }

  function replacePalette(entries: PaletteEntry[]) {
    paletteActions.replaceAll(entries);
    toast.success(t.importDialog.imported(entries.length), {
      action: { label: t.common.undo, onClick: paletteActions.undo },
    });
    setText("");
    changeOpen(false);
  }

  async function openImage(file: File | null) {
    if (!file) {
      toast.error(t.importDialog.notAnImage);
      return;
    }
    try {
      showImage(await readImage(file));
      setSource("image");
    } catch {
      toast.error(t.importDialog.imageFailed);
    }
  }

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files && files.length > 0) void openImage(firstImageFile(files));
    // Choosing the same file again still counts as a change.
    event.target.value = "";
  }

  // Images can be pasted or dropped anywhere in the dialog. Text is left to the text field.
  function onPaste(event: React.ClipboardEvent) {
    const file = firstImageFile(event.clipboardData.files);
    if (!file) return;
    event.preventDefault();
    void openImage(file);
  }

  function onDragOver(event: React.DragEvent) {
    if (!event.dataTransfer.types.includes(FILES_TYPE)) return;
    event.preventDefault();
    setDragging(true);
  }

  function onDragLeave(event: React.DragEvent) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  function onDrop(event: React.DragEvent) {
    if (!event.dataTransfer.types.includes(FILES_TYPE)) return;
    event.preventDefault();
    setDragging(false);
    void openImage(firstImageFile(event.dataTransfer.files));
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        onPaste={onPaste}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn("max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg", dragging && "ring-2 ring-foreground")}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{t.importDialog.title}</DialogTitle>
          <DialogDescription>
            {source === "text" ? t.importDialog.description(MAX_COLORS) : t.importDialog.imageDescription}
          </DialogDescription>
        </DialogHeader>
        <Segmented
          label={t.importDialog.source}
          value={source}
          onChange={setSource}
          options={[
            { value: "text", label: t.importDialog.fromText },
            { value: "image", label: t.importDialog.fromImage },
          ]}
        />
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFileChosen} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onFileChosen} />

        {source === "text" ? (
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={PLACEHOLDER}
            rows={6}
            spellCheck={false}
            aria-label={t.importDialog.inputLabel}
            className="font-mono text-sm"
          />
        ) : (
          <ImageImport
            image={image}
            count={count}
            maxCount={MAX_COLORS - edits.picked.length}
            onCountChange={changeCount}
            selection={selection}
            selectionFull={selectionFull}
            highlighted={highlighted}
            onSelect={(hex, point) =>
              setEdits((current) => ({ ...current, picked: [...current.picked, { id: createId(), hex, point }] }))
            }
            onMove={moveColor}
            onChoose={() => fileInput.current?.click()}
            onTakePhoto={() => cameraInput.current?.click()}
          />
        )}
        {colors.length > 0 && (
          <div className="space-y-2">
            <div className="flex h-9 overflow-hidden rounded-md ring-1 ring-foreground/10" aria-hidden="true">
              {colors.map((color, index) => (
                <span key={index} className="flex-1" style={{ backgroundColor: color.hex }} />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {colors.map((color, index) => (
                <li
                  key={index}
                  className="flex items-center gap-0.5"
                  onMouseEnter={() => setHighlighted(index)}
                  onMouseLeave={() => setHighlighted(null)}
                  onFocus={() => setHighlighted(index)}
                  onBlur={() => setHighlighted(null)}
                >
                  {/* The number of its marker on the image. */}
                  {source === "image" && (
                    <span className="mr-1 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                  )}
                  <SwatchLabel hex={color.hex}>{color.name || `#${displayHex(color.hex)}`}</SwatchLabel>
                  {/* Text is edited in the field above; the colors of an image are taken out one by one. */}
                  {source === "image" && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t.importDialog.removeFromSelection(`#${displayHex(color.hex)}`)}
                      onClick={() => setEdits((current) => removeFromSelection(current, selection[index].id))}
                    >
                      <X />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {tooFew && <p className="text-sm text-muted-foreground">{t.importDialog.needTwo}</p>}
        {nothingFound && (
          <p className="text-sm text-muted-foreground">
            {source === "text" ? t.importDialog.noneFound : t.importDialog.noColors}
          </p>
        )}
        {(source === "text" || image) && (
          <DialogFooter>
            {source === "image" && (
              <Button variant="outline" onClick={() => fileInput.current?.click()}>
                {t.importDialog.otherImage}
              </Button>
            )}
            <Button disabled={colors.length < MIN_COLORS} onClick={() => replacePalette(colors)}>
              {t.importDialog.replace}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
