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
import { readableOn } from "@/lib/color/contrast";
import { displayHex } from "@/lib/color/hex";
import { clampPoint, colorAt, type ImagePoint } from "@/lib/color/image";
import { MAX_COLORS, MIN_COLORS } from "@/lib/color/types";
import type { LoadedImage, SelectedColor } from "@/lib/image";
import { paletteActions } from "@/lib/palette-store";
import { cn } from "@/lib/utils";

/** Arrow keys move a point by this share of the image; with Shift by the larger one. */
const POINT_STEP = 0.01;
const POINT_STEP_LARGE = 0.1;
/** The image never takes more than this of the screen height, so the colors below it stay in view. */
const IMAGE_MAX_HEIGHT = "45dvh";
/** Half a marker (size-5), so a marker at the edge of the image stays on it. */
const MARKER_INSET = "0.625rem";
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

/** The point moved by an arrow key, or null for any other key. */
function movedByKey(event: React.KeyboardEvent, point: ImagePoint): ImagePoint | null {
  const arrow = ARROWS[event.key];
  if (!arrow) return null;
  const step = event.shiftKey ? POINT_STEP_LARGE : POINT_STEP;
  return clampPoint({ x: point.x + arrow.x * step, y: point.y + arrow.y * step });
}

/**
 * Pointer handlers that follow a pressed pointer over the image and report the point under it. `focusTarget` names
 * the control that takes the focus, so the keyboard carries on where the pointer left off.
 */
function dragOnImage(onMove: (point: ImagePoint) => void, focusTarget: (element: HTMLElement) => HTMLElement | null) {
  function report(event: React.PointerEvent<HTMLElement>) {
    const area = event.currentTarget.closest("[data-image-area]") ?? event.currentTarget;
    const box = area.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    onMove(clampPoint({ x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }));
  }
  return {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      if (event.button !== 0) return;
      // Keeps the browser from selecting text or moving the focus to the image itself.
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      focusTarget(event.currentTarget)?.focus({ preventScroll: true });
      report(event);
    },
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) report(event);
    },
  };
}

/** Keeps a marker on the image even where its point lies on the edge. */
function markerPosition({ x, y }: ImagePoint): React.CSSProperties {
  return {
    left: `clamp(${MARKER_INSET}, ${x * 100}%, 100% - ${MARKER_INSET})`,
    top: `clamp(${MARKER_INSET}, ${y * 100}%, 100% - ${MARKER_INSET})`,
  };
}

interface MarkerProps {
  color: SelectedColor;
  point: ImagePoint;
  number: number;
  highlighted: boolean;
  describedBy: string;
  onMove: (color: SelectedColor, point: ImagePoint) => void;
}

/** A numbered marker where a color of the selection comes from. Dragging it, or moving it with the arrow keys, changes the color. */
function Marker({ color, point, number, highlighted, describedBy, onMove }: MarkerProps) {
  const t = useT();
  const locale = useLocale();

  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label={t.importDialog.marker(number)}
      aria-valuenow={Math.round(point.x * 100)}
      aria-valuetext={t.importDialog.pointValue(
        `#${displayHex(color.hex)}`,
        formatPercent(locale, point.x),
        formatPercent(locale, point.y),
      )}
      aria-describedby={describedBy}
      {...dragOnImage(
        (next) => onMove(color, next),
        (element) => element,
      )}
      onKeyDown={(event) => {
        const next = movedByKey(event, point);
        if (!next) return;
        event.preventDefault();
        onMove(color, next);
      }}
      className={cn(
        // The invisible frame around it makes the marker easier to catch with a finger.
        "absolute flex size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-background text-[10px] font-semibold tabular-nums ring-1 ring-foreground/60 transition-transform before:absolute before:-inset-2.5 focus:z-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing",
        highlighted && "z-10 scale-150 ring-2 ring-foreground",
      )}
      style={{ ...markerPosition(point), backgroundColor: color.hex, color: readableOn(color.hex) }}
    >
      {number}
    </span>
  );
}

interface PointPickerProps {
  image: LoadedImage;
  selection: readonly SelectedColor[];
  selectionFull: boolean;
  /** Position of the color whose marker stands out, while its entry in the list is hovered or focused. */
  highlighted: number | null;
  onSelect: (hex: string, point: ImagePoint) => void;
  onMove: (color: SelectedColor, point: ImagePoint) => void;
}

/**
 * The image with a point to pick from and a numbered marker for each color of the selection. The point's color can
 * join the selection or go straight into the current palette; moving a marker changes its color.
 */
function PointPicker({ image, selection, selectionFull, highlighted, onSelect, onMove }: PointPickerProps) {
  const t = useT();
  const locale = useLocale();
  const hintId = useId();
  const colors = usePalette()?.colors ?? [];
  const [point, setPoint] = useState(CENTER);
  const [status, setStatus] = useState("");
  const hex = colorAt(image.pixels, point);
  const label = hex ? `#${displayHex(hex)}` : t.importDialog.transparent;
  const inSelection = hex !== null && selection.some((color) => color.hex === hex);
  const canSelect = hex !== null && !inSelection && !selectionFull;
  const isPaletteFull = colors.length >= MAX_COLORS;
  const ratio = image.pixels.width / image.pixels.height;

  function select() {
    if (!hex || !canSelect) return;
    onSelect(hex, point);
    setStatus(t.importDialog.addedToSelection(label));
  }

  function addToPalette() {
    const last = colors.at(-1);
    if (!hex || !last || !paletteActions.insertAfter(last.id, hex)) return;
    toast.success(t.importDialog.added(label), {
      action: { label: t.common.undo, onClick: paletteActions.undo },
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    const next = movedByKey(event, point);
    if (next) {
      event.preventDefault();
      setPoint(next);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select();
    }
  }

  return (
    <div className="space-y-3">
      <div
        data-image-area
        {...dragOnImage(setPoint, (area) => area.querySelector<HTMLElement>("[data-point]"))}
        className="relative mx-auto cursor-crosshair touch-none rounded-[10px] select-none"
        style={{ aspectRatio: ratio, width: `min(100%, ${IMAGE_MAX_HEIGHT} * ${ratio})` }}
      >
        {/* An object URL of a local file; next/image has nothing to optimize. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" draggable={false} className="size-full rounded-[10px] object-cover" />
        {/*
          The point to pick from: one control for both axes, like the saturation area of the color picker; the value
          text names both. Two rings in the page colors keep it visible on any image. The image moves it, so a marker
          beneath it can still be grabbed.
        */}
        <span
          data-point
          role="slider"
          tabIndex={0}
          aria-label={t.importDialog.point}
          aria-valuenow={Math.round(point.x * 100)}
          aria-valuetext={t.importDialog.pointValue(label, formatPercent(locale, point.x), formatPercent(locale, point.y))}
          aria-describedby={hintId}
          onKeyDown={onKeyDown}
          className="pointer-events-none absolute z-20 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background ring-2 ring-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, backgroundColor: hex ?? "transparent" }}
        />
        {/* Where the colors of the selection come from, numbered like the list below the image. */}
        {selection.map(
          (color, index) =>
            color.point && (
              <Marker
                key={color.id}
                color={color}
                point={color.point}
                number={index + 1}
                highlighted={index === highlighted}
                describedBy={hintId}
                onMove={onMove}
              />
            ),
        )}
      </div>
      <p id={hintId} className="text-muted-foreground">
        {t.importDialog.pointHint} {t.importDialog.markerHint}
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

interface ImageImportProps extends Omit<PointPickerProps, "image"> {
  image: LoadedImage | null;
  count: number;
  /** Largest number of dominant colors that still leaves room for the picked ones. */
  maxCount: number;
  onCountChange: (count: number) => void;
  onChoose: () => void;
  onTakePhoto: () => void;
}

/** The image side of the import dialog: an empty picture slot, or the image with its point and the number of colors to take. */
export function ImageImport({
  image,
  count,
  maxCount,
  onCountChange,
  onChoose,
  onTakePhoto,
  ...picker
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
      <PointPicker key={image.url} image={image} {...picker} />
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
