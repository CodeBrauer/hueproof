"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ContrastPanel } from "@/components/analysis/contrast-panel";
import { PreviewPanel } from "@/components/analysis/preview-panel";
import { TemperaturePanel } from "@/components/analysis/temperature-panel";
import { VisionPanel } from "@/components/analysis/vision-panel";
import { ColorColumn } from "@/components/color-column";
import { ColorDrawer } from "@/components/color-drawer";
import { ExportDialog } from "@/components/dialogs/export-dialog";
import { ImportDialog } from "@/components/dialogs/import-dialog";
import { LibraryDialog } from "@/components/dialogs/library-dialog";
import { Toolbar, type DialogId } from "@/components/toolbar";
import { useColorNames } from "@/hooks/use-color-names";
import { useCopy } from "@/hooks/use-copy";
import { usePalette } from "@/hooks/use-palette";
import { useLocale, useT } from "@/i18n/context";
import { formatPercent } from "@/i18n/locales";
import { CONTRAST_THRESHOLDS, wcagRatio } from "@/lib/color/contrast";
import { analyzePairs } from "@/lib/color/difference";
import { suggestRoles } from "@/lib/color/roles";
import { temperatureBalance } from "@/lib/color/temperature";
import { MAX_COLORS, MIN_COLORS } from "@/lib/color/types";
import type { VisionId } from "@/lib/color/vision";
import { paletteActions } from "@/lib/palette-store";
import { cn } from "@/lib/utils";

type AnalysisTab = "contrast" | "vision" | "temperature" | "preview";
type Tone = "good" | "warning" | "problem";

/** Elements that handle the keyboard themselves; global shortcuts stay out of their way. */
const KEYBOARD_OWNERS =
  'input, textarea, select, button, a, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]';
/** The colors stack on phones and sit side by side from 768 px up. */
const COLUMN_AREA = "flex flex-col md:flex-row";
const SKELETON_COLUMNS = 5;

const ANALYSIS_TABS: readonly AnalysisTab[] = ["contrast", "vision", "temperature", "preview"];

const TONE_STYLES: Record<Tone, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  problem: "text-red-600 dark:text-red-400",
};

function useShortcuts() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || (event.target instanceof Element && event.target.closest(KEYBOARD_OWNERS))) return;
      const hasCommand = event.metaKey || event.ctrlKey;
      if (event.code === "Space" && !hasCommand) {
        event.preventDefault();
        paletteActions.generate();
      } else if (event.key.toLowerCase() === "z" && hasCommand) {
        event.preventDefault();
        if (event.shiftKey) paletteActions.redo();
        else paletteActions.undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export function PaletteApp() {
  const t = useT();
  const locale = useLocale();
  const copy = useCopy();
  const snapshot = usePalette();
  const nameOf = useColorNames();
  const [vision, setVision] = useState<VisionId>("normal");
  const [tab, setTab] = useState<AnalysisTab>("contrast");
  const [dialog, setDialog] = useState<DialogId | null>(null);
  const [detail, setDetail] = useState<{ id: string; open: boolean } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useShortcuts();

  const colors = snapshot?.colors;
  const hexes = useMemo(() => colors?.map((color) => color.hex) ?? [], [colors]);
  const pairs = useMemo(() => analyzePairs(hexes), [hexes]);
  const detailColor = colors?.find((color) => color.id === detail?.id) ?? null;

  // The one accent on the page (the dot of the large wordmark below the tool) follows the palette.
  const accent = hexes.length > 0 ? hexes[suggestRoles(hexes).primary] : null;
  useEffect(() => {
    if (accent) document.documentElement.style.setProperty("--palette-accent", accent);
  }, [accent]);

  // The headline finding of each tab, shown on the tab itself.
  const readable = pairs.filter((pair) => wcagRatio(hexes[pair.a], hexes[pair.b]) >= CONTRAST_THRESHOLDS.wcag[1]).length;
  const confusable = pairs.filter((pair) => pair.category === "confusable").length;
  const marginal = pairs.filter((pair) => pair.category === "marginal").length;
  const balance = temperatureBalance(hexes);
  const tabStatus: Record<AnalysisTab, { text: string; tone?: Tone }> = {
    contrast: { text: t.status.readable(readable, pairs.length), tone: readable > 0 ? "good" : "problem" },
    vision:
      confusable > 0
        ? { text: t.status.confusable(confusable), tone: "problem" }
        : marginal > 0
          ? { text: t.status.marginal(marginal), tone: "warning" }
          : { text: t.status.allDistinct, tone: "good" },
    temperature: { text: t.status.temperature(formatPercent(locale, balance.warm), formatPercent(locale, balance.cool)) },
    preview: { text: t.status.preview },
  };

  function addColor() {
    const last = colors?.at(-1);
    if (last && !paletteActions.insertAfter(last.id)) toast.info(t.toolbar.paletteFull(MAX_COLORS));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) paletteActions.move(String(active.id), String(over.id));
  }

  const setDialogOpen = (id: DialogId) => (open: boolean) => setDialog(open ? id : null);

  return (
    <div className="flex flex-col">
      <Toolbar
        snapshot={snapshot}
        vision={vision}
        onVisionChange={setVision}
        onOpenDialog={setDialog}
        onAdd={addColor}
        onShare={() => copy(window.location.href, t.toolbar.sharedWhat)}
      />

      <div className="relative">
        {colors ? (
          <DndContext id="palette" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={colors.map((color) => color.id)} strategy={rectSortingStrategy}>
              <ol className={COLUMN_AREA} aria-label={t.column.listLabel}>
                {colors.map((color, index) => (
                  <ColorColumn
                    key={color.id}
                    color={color}
                    position={index + 1}
                    vision={vision}
                    canRemove={colors.length > MIN_COLORS}
                    canAdd={colors.length < MAX_COLORS}
                    isFirst={index === 0}
                    isLast={index === colors.length - 1}
                    // The details button toggles: a second press on the same color closes the drawer.
                    onShowDetails={(id) =>
                      setDetail((current) => ({ id, open: !(current?.open && current.id === id) }))
                    }
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        ) : (
          <div className={cn(COLUMN_AREA, "overflow-hidden rounded-lg")} aria-hidden="true">
            {Array.from({ length: SKELETON_COLUMNS }, (_, index) => (
              <div
                key={index}
                className="h-[4.75rem] flex-1 animate-pulse bg-muted md:h-[min(46vh,29rem)] md:min-h-60"
                style={{ opacity: 1 - index * 0.15 }}
              />
            ))}
          </div>
        )}

        {vision !== "normal" && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-6">
            <span className="pointer-events-auto inline-flex items-center gap-1 rounded-[10px] bg-foreground py-1 pr-1 pl-3.5 text-sm font-semibold text-background">
              {t.status.simulating(t.vision.types[vision].label)}
              <button
                type="button"
                aria-label={t.status.reset}
                onClick={() => setVision("normal")}
                className="flex size-7 items-center justify-center rounded-md hover:bg-background/20 focus-visible:outline-2 focus-visible:outline-background"
              >
                <X className="size-4" />
              </button>
            </span>
          </div>
        )}
      </div>

      {colors && (
        <>
          <TabsPrimitive.Root value={tab} onValueChange={(next) => setTab(next as AnalysisTab)} className="pt-10 pb-10">
            {/* The tabs are large words; the selected one is dark and carries the accent dot. */}
            <TabsPrimitive.List
              aria-label={t.tabs.label}
              className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-foreground pt-5 pb-6 md:grid-cols-4"
            >
              {ANALYSIS_TABS.map((id) => {
                const { text, tone } = tabStatus[id];
                const ToneIcon = tone === "good" ? CircleCheck : TriangleAlert;
                return (
                  <TabsPrimitive.Trigger
                    key={id}
                    value={id}
                    className="group flex min-w-0 flex-col items-start gap-0.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <span className="font-display text-[1.6rem] leading-tight text-quiet transition-colors group-hover:text-foreground group-data-[state=active]:text-foreground sm:text-3xl">
                      {t.tabs[id]}
                      <span
                        className="ml-[0.06em] hidden size-[0.26em] rounded-full group-data-[state=active]:inline-block"
                        style={{ backgroundColor: "var(--palette-accent, currentColor)" }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-start gap-1.5 text-[13px] text-muted-foreground">
                      {tone && <ToneIcon className={cn("mt-0.5 size-3.5 shrink-0", TONE_STYLES[tone])} aria-hidden="true" />}
                      {text}
                    </span>
                  </TabsPrimitive.Trigger>
                );
              })}
            </TabsPrimitive.List>

            <TabsPrimitive.Content value="contrast" className="outline-none">
              <ContrastPanel colors={colors} nameOf={nameOf} />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="vision" className="outline-none">
              <VisionPanel colors={colors} nameOf={nameOf} pairs={pairs} vision={vision} onVisionChange={setVision} />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="temperature" className="outline-none">
              <TemperaturePanel colors={colors} nameOf={nameOf} />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="preview" className="outline-none">
              <PreviewPanel colors={colors} nameOf={nameOf} />
            </TabsPrimitive.Content>
          </TabsPrimitive.Root>

          <ColorDrawer
            color={detailColor}
            open={detail?.open ?? false}
            colorCount={colors.length}
            nameOf={nameOf}
            onClose={() => setDetail((current) => current && { ...current, open: false })}
          />
          <ImportDialog open={dialog === "import"} onOpenChange={setDialogOpen("import")} />
          <LibraryDialog open={dialog === "library"} onOpenChange={setDialogOpen("library")} colors={colors} />
          <ExportDialog
            open={dialog === "export"}
            onOpenChange={setDialogOpen("export")}
            colors={colors.map((color) => ({ name: nameOf(color), hex: color.hex }))}
          />
        </>
      )}
    </div>
  );
}
