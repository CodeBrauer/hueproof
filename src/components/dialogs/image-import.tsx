"use client";

import { Camera, ImageUp, Plus } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/panel";
import { Segmented } from "@/components/segmented";
import { SwatchLabel } from "@/components/swatch-label";
import { Button } from "@/components/ui/button";
import { usePalette } from "@/hooks/use-palette";
import { useLocale, useT } from "@/i18n/context";
import { formatPercent } from "@/i18n/locales";
import { displayHex } from "@/lib/color/hex";
import { clampPoint, colorAt, type ImagePoint } from "@/lib/color/image";
import { MAX_COLORS, MIN_COLORS } from "@/lib/color/types";
import type { LoadedImage } from "@/lib/image";
import { paletteActions } from "@/lib/palette-store";

/** Arrow keys move the point by this share of the image; with Shift by the larger one. */
const POINT_STEP = 0.01;
const POINT_STEP_LARGE = 0.1;
/** The image never takes more than this of the screen height, so the colors below it stay in view. */
const IMAGE_MAX_HEIGHT = "45dvh";
const CENTER: ImagePoint = { x: 0.5, y: 0.5 };
const ARROWS: Record<string, ImagePoint> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

function countOptions(max: number) {
  return Array.from({ length: max - MIN_COLORS + 1 }, (_, index) => {
    const value = String(MIN_COLORS + index);
    return { value, label: value };
  });
}

interface PointPickerProps {
  image: LoadedImage;
  selection: readonly string[];
  selectionFull: boolean;
  onSelect: (hex: string) => void;
}

/**
 * The image with a point on it: drag or tap to move the point, or use the arrow keys.
 * Its color can join the selection that replaces the palette, or go straight into the current palette.
 */
function PointPicker({ image, selection, selectionFull, onSelect }: PointPickerProps) {
  const t = useT();
  const locale = useLocale();
  const hintId = useId();
  const colors = usePalette()?.colors ?? [];
  const [point, setPoint] = useState(CENTER);
  const [status, setStatus] = useState("");
  const hex = colorAt(image.pixels, point);
  const label = hex ? `#${displayHex(hex)}` : t.importDialog.transparent;
  const inSelection = hex !== null && selection.includes(hex);
  const canSelect = hex !== null && !inSelection && !selectionFull;
  const isPaletteFull = colors.length >= MAX_COLORS;
  const ratio = image.pixels.width / image.pixels.height;

  function select() {
    if (!hex || !canSelect) return;
    onSelect(hex);
    setStatus(t.importDialog.addedToSelection(label));
  }

  function addToPalette() {
    const last = colors.at(-1);
    if (!hex || !last || !paletteActions.insertAfter(last.id, hex)) return;
    toast.success(t.importDialog.added(label), {
      action: { label: t.common.undo, onClick: paletteActions.undo },
    });
  }

  function moveTo(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    setPoint(clampPoint({ x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const step = event.shiftKey ? POINT_STEP_LARGE : POINT_STEP;
      setPoint((current) => clampPoint({ x: current.x + arrow.x * step, y: current.y + arrow.y * step }));
    } else if (event.key === "Enter") {
      event.preventDefault();
      select();
    }
  }

  return (
    <div className="space-y-3">
      {/* One control for both axes, like the saturation area of the color picker. The value text names both. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={t.importDialog.point}
        aria-valuenow={Math.round(point.x * 100)}
        aria-valuetext={t.importDialog.pointValue(label, formatPercent(locale, point.x), formatPercent(locale, point.y))}
        aria-describedby={hintId}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          moveTo(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event);
        }}
        onKeyDown={onKeyDown}
        className="relative mx-auto cursor-crosshair touch-none rounded-[10px] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        style={{ aspectRatio: ratio, width: `min(100%, ${IMAGE_MAX_HEIGHT} * ${ratio})` }}
      >
        {/* An object URL of a local file; next/image has nothing to optimize. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" draggable={false} className="size-full rounded-[10px] object-cover" />
        {/* Two rings in the page colors keep the point visible on any image. */}
        <span
          className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background ring-2 ring-foreground"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, backgroundColor: hex ?? "transparent" }}
          aria-hidden="true"
        />
      </div>
      <p id={hintId} className="text-muted-foreground">
        {t.importDialog.pointHint}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {hex ? (
          <SwatchLabel hex={hex} className="font-medium">
            {label}
          </SwatchLabel>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!canSelect} onClick={select}>
            <Plus />
            {t.importDialog.addToSelection}
          </Button>
          <Button variant="outline" disabled={!hex || isPaletteFull} onClick={addToPalette}>
            <Plus />
            {t.importDialog.addToPalette}
          </Button>
        </div>
      </div>
      {inSelection && <p className="text-muted-foreground">{t.importDialog.inSelection}</p>}
      {!inSelection && selectionFull && (
        <p className="text-muted-foreground">{t.importDialog.selectionFull(MAX_COLORS)}</p>
      )}
      {isPaletteFull && <p className="text-muted-foreground">{t.toolbar.paletteFull(MAX_COLORS)}</p>}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

interface ImageImportProps {
  image: LoadedImage | null;
  count: number;
  /** Largest number of dominant colors that still leaves room for the picked ones. */
  maxCount: number;
  onCountChange: (count: number) => void;
  selection: readonly string[];
  selectionFull: boolean;
  onSelect: (hex: string) => void;
  onChoose: () => void;
  onTakePhoto: () => void;
}

/** The image side of the import dialog: an empty picture slot, or the image with its point and the number of colors to take. */
export function ImageImport({
  image,
  count,
  maxCount,
  onCountChange,
  selection,
  selectionFull,
  onSelect,
  onChoose,
  onTakePhoto,
}: ImageImportProps) {
  const t = useT();

  if (!image) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-border px-4 py-10 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={onChoose}>
            <ImageUp />
            {t.importDialog.chooseImage}
          </Button>
          {/* Opens the camera on phones and tablets; elsewhere it would only repeat the button above. */}
          <Button variant="outline" className="hidden pointer-coarse:inline-flex" onClick={onTakePhoto}>
            <Camera />
            {t.importDialog.takePhoto}
          </Button>
        </div>
        <p className="text-muted-foreground">{t.importDialog.dropHint}</p>
      </div>
    );
  }

  return (
    <>
      {/* A new image starts with the point in the middle again. */}
      <PointPicker
        key={image.url}
        image={image}
        selection={selection}
        selectionFull={selectionFull}
        onSelect={onSelect}
      />
      <Field label={t.importDialog.colorCount} className="pb-0">
        <Segmented
          size="sm"
          label={t.importDialog.colorCount}
          value={String(count)}
          onChange={(value) => onCountChange(Number(value))}
          options={countOptions(maxCount)}
          className="gap-x-4"
        />
      </Field>
    </>
  );
}
