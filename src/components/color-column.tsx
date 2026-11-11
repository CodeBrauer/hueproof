"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Info, Lock, LockOpen, Pipette, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSuggestedName } from "@/hooks/use-color-names";
import { useCopy } from "@/hooks/use-copy";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useT } from "@/i18n/context";
import { readableOn } from "@/lib/color/contrast";
import { displayHex, normalizeHex, sanitizeName } from "@/lib/color/hex";
import { MAX_NAME_LENGTH, type PaletteColor } from "@/lib/color/types";
import { simulate, type VisionId } from "@/lib/color/vision";
import { paletteActions } from "@/lib/palette-store";
import { cn } from "@/lib/utils";

const HOVER_TINT = "hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)]";
/** Marks text that can be clicked to change it, visible without hovering. */
const EDITABLE_UNDERLINE = "underline decoration-current/40 decoration-dotted decoration-1 underline-offset-4";

function ColumnAction({
  label,
  side,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { label: string; side: "top" | "left" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex size-8 items-center justify-center rounded-md opacity-75 transition md:size-9",
            "hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-current",
            "disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4",
            HOVER_TINT,
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

function NameField({ color }: { color: PaletteColor }) {
  const t = useT();
  const suggested = useSuggestedName(color.hex);
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);

  function commit() {
    if (cancelled.current) {
      cancelled.current = false;
      setDraft(null);
      return;
    }
    if (draft === null) return;
    const next = sanitizeName(draft);
    // An empty field, or the suggestion typed out, hands naming back to the suggestion.
    const name = next === suggested ? "" : next;
    if (name !== color.name) paletteActions.setName(color.id, name);
    setDraft(null);
  }

  return (
    <input
      value={draft ?? (color.name || suggested || "")}
      placeholder={t.column.namePlaceholder}
      aria-label={t.column.nameLabel(displayHex(color.hex))}
      maxLength={MAX_NAME_LENGTH}
      spellCheck={false}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Escape") cancelled.current = true;
        if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
      }}
      className={cn(
        "w-full min-w-0 truncate rounded-sm bg-transparent outline-none placeholder:text-current placeholder:opacity-50",
        EDITABLE_UNDERLINE,
        "focus:bg-[color-mix(in_srgb,currentColor_10%,transparent)]",
        HOVER_TINT,
      )}
    />
  );
}

interface ColorColumnProps {
  color: PaletteColor;
  /** 1-based place in the palette, shown as a small label. */
  position: number;
  vision: VisionId;
  canRemove: boolean;
  canAdd: boolean;
  isFirst: boolean;
  isLast: boolean;
  onShowDetails: (id: string) => void;
}

/**
 * One palette color: the swatch with its actions, and its hex code and name below it.
 * On narrow screens the colors stack as rows and the label sits inside the swatch.
 */
export function ColorColumn({
  color,
  position,
  vision,
  canRemove,
  canAdd,
  isFirst,
  isLast,
  onShowDetails,
}: ColorColumnProps) {
  const t = useT();
  const copy = useCopy();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: color.id,
  });
  // The actions stack vertically beside the swatch on wide screens, so their tooltips open sideways
  // instead of covering the next action.
  const tooltipSide = useMediaQuery("(min-width: 768px)") ? "left" : "top";
  const shown = simulate(color.hex, vision);
  const ink = readableOn(shown);
  const label = displayHex(color.hex);

  function changeHex(input: string) {
    const hex = normalizeHex(input);
    if (hex && hex !== color.hex) paletteActions.setHex(color.id, hex);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, "--on-swatch": ink } as React.CSSProperties}
      className={cn("palette-column relative min-w-0 flex-1", isDragging && "z-20")}
    >
      <div
        style={{ backgroundColor: shown, color: ink }}
        className={cn(
          // A faint inner edge keeps colors close to the page background visible.
          "relative flex h-[4.75rem] items-center justify-end px-2 ring-1 ring-foreground/10 ring-inset",
          "md:h-[min(46vh,29rem)] md:min-h-60 md:items-end md:justify-center md:px-0 md:pb-4",
          isFirst && "max-md:rounded-t-lg md:rounded-l-lg",
          isLast && "max-md:rounded-b-lg md:rounded-r-lg",
          isDragging && "ring-2 ring-foreground",
        )}
      >
        <div className="flex shrink-0 items-center md:flex-col-reverse">
          <div className={cn(!color.locked && "column-reveal")}>
            <ColumnAction
              side={tooltipSide}
              label={color.locked ? t.column.unlock : t.column.lock}
              aria-pressed={color.locked}
              className={cn(color.locked && "opacity-100")}
              onClick={() => paletteActions.toggleLock(color.id)}
            >
              {color.locked ? <Lock /> : <LockOpen />}
            </ColumnAction>
          </div>
          <div className="column-reveal flex items-center md:flex-col-reverse">
            <ColumnAction side={tooltipSide} label={t.column.copyHex} onClick={() => copy(`#${label}`)}>
              <Copy />
            </ColumnAction>
            <ColumnAction side={tooltipSide} label={t.column.details} onClick={() => onShowDetails(color.id)}>
              <Info />
            </ColumnAction>
            <ColumnAction
              side={tooltipSide}
              label={t.column.drag}
              ref={setActivatorNodeRef}
              className="cursor-grab touch-none active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical />
            </ColumnAction>
            <ColumnAction side={tooltipSide} label={t.column.remove} disabled={!canRemove} onClick={() => paletteActions.remove(color.id)}>
              <X />
            </ColumnAction>
          </div>
        </div>

        {canAdd && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t.column.addAfter}
                onClick={() => paletteActions.insertAfter(color.id)}
                className={cn(
                  "column-reveal absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-md bg-white text-black ring-1 ring-black/30 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current md:flex",
                  isLast ? "right-3" : "right-0 translate-x-1/2",
                )}
              >
                <Plus className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t.column.add}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col items-start md:pt-3 md:pr-3",
          "max-md:pointer-events-none max-md:absolute max-md:inset-y-0 max-md:right-44 max-md:left-3 max-md:justify-center max-md:[color:var(--on-swatch)] max-md:*:pointer-events-auto",
        )}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t.column.changeColor(label)}
              className={cn(
                "-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 font-display text-2xl leading-tight focus-visible:outline-2 focus-visible:outline-current md:text-[clamp(1rem,1.9vw,1.7rem)]",
                HOVER_TINT,
              )}
            >
              <span className={EDITABLE_UNDERLINE}>
                <span className="opacity-50">#</span>
                {label}
              </span>
              <Pipette className="size-[0.6em] shrink-0 opacity-60 max-xs:hidden" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto space-y-3 p-3">
            <HexColorPicker color={color.hex} onChange={changeHex} />
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground tabular-nums">#</span>
              <HexColorInput
                color={color.hex}
                onChange={changeHex}
                aria-label={t.column.hexCode}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm uppercase tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          </PopoverContent>
        </Popover>
        <div className="flex w-full min-w-0 items-baseline gap-1 text-[13px] max-md:opacity-80 md:text-muted-foreground">
          <span className="shrink-0 tabular-nums" aria-hidden="true">
            {String(position).padStart(2, "0")} ·
          </span>
          <NameField color={color} />
        </div>
      </div>
    </li>
  );
}
