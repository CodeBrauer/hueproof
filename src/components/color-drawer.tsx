"use client";

import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Segmented } from "@/components/segmented";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCopy } from "@/hooks/use-copy";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLocale, useT } from "@/i18n/context";
import { formatContrast, readableOn, wcagRatio } from "@/lib/color/contrast";
import { colorFamily } from "@/lib/color/family";
import { colorFormats } from "@/lib/color/formats";
import { displayHex } from "@/lib/color/hex";
import { COLOR_MEANINGS } from "@/lib/color/meaning";
import { classifyTemperature } from "@/lib/color/temperature";
import { MAX_COLORS, type PaletteColor } from "@/lib/color/types";
import { harmonies, shades, similarColors, tints, tones } from "@/lib/color/variations";
import { DEFICIENCY_TYPES, simulate } from "@/lib/color/vision";
import { paletteActions } from "@/lib/palette-store";
import { REFERENCES } from "@/lib/references";

interface SwatchContext {
  /** The palette color the drawer is about. */
  target: PaletteColor;
  targetName: string;
  isFull: boolean;
}

function SwatchMenu({ hex, context }: { hex: string; context: SwatchContext }) {
  const t = useT();
  const copy = useCopy();
  const { target, targetName, isFull } = context;
  const label = `#${displayHex(hex)}`;
  const isBase = hex === target.hex;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={isBase ? t.drawer.currentColor(label) : label}
          title={label}
          className="relative min-w-0 flex-1 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current"
          style={{ backgroundColor: hex, color: readableOn(hex) }}
        >
          {isBase && <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-current" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="tabular-nums">{label}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => copy(label)}>{t.drawer.copyHex}</DropdownMenuItem>
        <DropdownMenuItem disabled={isBase} onSelect={() => paletteActions.replaceHex(target.id, hex)}>
          {t.drawer.replace(targetName)}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isFull} onSelect={() => paletteActions.insertAfter(target.id, hex)}>
          {t.drawer.addToPalette}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SwatchStrip({
  label,
  hint,
  hexes,
  context,
  action,
}: {
  label: string;
  hint?: string;
  hexes: string[];
  context: SwatchContext;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">
          {label}
          {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
        </h4>
        {action}
      </div>
      <div className="flex h-10 overflow-hidden rounded-md ring-1 ring-foreground/15">
        {hexes.map((hex, index) => (
          <SwatchMenu key={`${hex}-${index}`} hex={hex} context={context} />
        ))}
      </div>
    </div>
  );
}

function UsageTile({ title, detail, children }: { title: string; detail?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {children}
      <p className="flex justify-between text-xs text-muted-foreground">
        <span>{title}</span>
        {detail && <span className="tabular-nums">{detail}</span>}
      </p>
    </div>
  );
}

function FormatsTab({ hex }: { hex: string }) {
  const t = useT();
  const copy = useCopy();
  const ink = readableOn(hex);
  const ratio = (text: string, background: string) => t.decimal(formatContrast("wcag", wcagRatio(text, background)));
  const tile = "flex h-14 items-center justify-center rounded-lg text-lg font-semibold ring-1 ring-foreground/15";
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <ul className="divide-y divide-border border-y border-border">
          {colorFormats(hex).map((format) => (
            <li key={format.id} className="flex items-center gap-1 hover:bg-muted/60">
              <button
                type="button"
                title={t.drawer.copyRow}
                onClick={() => copy(format.plain, `${format.label} ${format.plain}`)}
                className="flex min-w-0 flex-1 items-baseline gap-3 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">{format.label}</span>
                <span className="truncate tabular-nums text-sm">{format.plain}</span>
              </button>
              {format.css && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => copy(format.css!)}
                  aria-label={t.drawer.copyAsCss(format.label)}
                >
                  CSS
                </Button>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t.drawer.formatsNote}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">{t.drawer.inUse}</h4>
        <div className="grid grid-cols-2 gap-3">
          <UsageTile title={t.drawer.textOnWhite} detail={ratio(hex, "#ffffff")}>
            <div className={tile} style={{ backgroundColor: "#ffffff", color: hex }}>
              Aa
            </div>
          </UsageTile>
          <UsageTile title={t.drawer.textOnBlack} detail={ratio(hex, "#000000")}>
            <div className={tile} style={{ backgroundColor: "#000000", color: hex }}>
              Aa
            </div>
          </UsageTile>
          <UsageTile title={t.drawer.asBackground} detail={ratio(ink, hex)}>
            <div className={tile} style={{ backgroundColor: hex, color: ink }}>
              Aa
            </div>
          </UsageTile>
          <UsageTile title={t.drawer.asBorder}>
            <div className={tile} style={{ boxShadow: `inset 0 0 0 3px ${hex}` }} />
          </UsageTile>
        </div>
      </div>
    </div>
  );
}

function VariationsTab({ context }: { context: SwatchContext }) {
  const t = useT();
  const { hex } = context.target;
  return (
    <div className="space-y-5">
      <SwatchStrip label={t.drawer.shades} hint={t.drawer.shadesHint} hexes={[hex, ...shades(hex)]} context={context} />
      <SwatchStrip label={t.drawer.tints} hint={t.drawer.tintsHint} hexes={[hex, ...tints(hex)]} context={context} />
      <SwatchStrip label={t.drawer.tones} hint={t.drawer.tonesHint} hexes={tones(hex)} context={context} />
      <SwatchStrip label={t.drawer.similar} hint={t.drawer.similarHint} hexes={similarColors(hex)} context={context} />
      <p className="text-xs text-muted-foreground">{t.drawer.variationsNote}</p>
    </div>
  );
}

function HarmoniesTab({ context }: { context: SwatchContext }) {
  const t = useT();
  function applyAsPalette(hexes: string[]) {
    paletteActions.replaceAll(hexes.map((hex) => ({ hex, name: "" })));
    toast.success(t.drawer.paletteReplaced, { action: { label: t.common.undo, onClick: paletteActions.undo } });
  }
  return (
    <div className="space-y-5">
      {harmonies(context.target.hex).map((harmony) => (
        <SwatchStrip
          key={harmony.id}
          label={t.drawer.harmonies[harmony.id]}
          hexes={harmony.colors}
          context={context}
          action={
            <Button variant="ghost" size="xs" onClick={() => applyAsPalette(harmony.colors)}>
              {t.drawer.useAsPalette}
            </Button>
          }
        />
      ))}
      <p className="text-xs text-muted-foreground">{t.drawer.harmoniesNote}</p>
    </div>
  );
}

function VisionTab({ hex }: { hex: string }) {
  const t = useT();
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {DEFICIENCY_TYPES.map((type) => {
          const simulated = simulate(hex, type.id);
          return (
            <li key={type.id} className="grid grid-cols-[1fr_auto_4.5rem] items-center gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{t.vision.types[type.id].label}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.vision.types[type.id].description}</span>
              </span>
              <span className="flex overflow-hidden rounded-md ring-1 ring-foreground/15" aria-hidden="true">
                <span className="h-9 w-10" style={{ backgroundColor: hex }} />
                <span className="h-9 w-10" style={{ backgroundColor: simulated }} />
              </span>
              <span className="tabular-nums text-xs text-muted-foreground">#{displayHex(simulated)}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{t.drawer.visionNote}</p>
    </div>
  );
}

function MeaningTab({ hex }: { hex: string }) {
  const t = useT();
  const locale = useLocale();
  const family = colorFamily(hex);
  const claims = COLOR_MEANINGS[family];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t.drawer.closestFamily}</span>
        <Badge variant="secondary">{t.drawer.families[family]}</Badge>
        <Badge variant="outline">{t.temperature.labels[classifyTemperature(hex)]}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {t.drawer.meaningNote(<SourceLink reference={REFERENCES.colorPsychologyReview} />)}
      </p>
      {claims.length === 0 ? (
        <p className="text-sm">{t.drawer.noMeaning}</p>
      ) : (
        <ul className="space-y-4">
          {claims.map((claim) => (
            <li key={claim.claim.en} className="space-y-1.5 border-t border-border pt-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">{claim.claim[locale]}</p>
                <Badge variant="outline">{t.drawer.kinds[claim.kind]}</Badge>
              </div>
              {claim.caveat && <p className="text-xs text-muted-foreground">{claim.caveat[locale]}</p>}
              <ul className="space-y-0.5">
                {claim.sources.map((source) => (
                  <li key={source.url} className="text-xs">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={source.title}
                      className="inline-flex items-center gap-1 text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      {source.authors} ({source.year}), {source.container}
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DRAWER_TABS = ["formats", "variations", "harmonies", "vision", "meaning"] as const;
type DrawerTab = (typeof DRAWER_TABS)[number];

interface ColorDrawerProps {
  /** The color to show; stays set while the drawer animates out. */
  color: PaletteColor | null;
  open: boolean;
  colorCount: number;
  nameOf: (color: PaletteColor) => string;
  onClose: () => void;
}

export function ColorDrawer({ color, open, colorCount, nameOf, onClose }: ColorDrawerProps) {
  const t = useT();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [tab, setTab] = useState<DrawerTab>("formats");

  return (
    // Not modal: the palette stays visible and usable, so a replaced color shows its effect at once.
    // Beside the palette it behaves like an inspector and stays open while you work there;
    // as a sheet over the page on small screens, a tap outside closes it.
    <Sheet modal={false} open={open && color !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        onInteractOutside={(event) => {
          if (isDesktop) event.preventDefault();
        }}
        className="gap-0 overflow-y-auto border-foreground shadow-none data-[side=bottom]:h-[85dvh] data-[side=bottom]:rounded-t-lg data-[side=bottom]:border-t data-[side=right]:border-l data-[side=right]:sm:max-w-md"
      >
        {color && (
          <>
            <SheetHeader
              className="relative flex h-28 shrink-0 flex-col justify-end gap-0 p-4"
              style={{ backgroundColor: color.hex, color: readableOn(color.hex) }}
            >
              <SheetTitle className="font-display text-3xl" style={{ color: "inherit" }}>
                #{displayHex(color.hex)}
              </SheetTitle>
              <SheetDescription className="opacity-80" style={{ color: "inherit" }}>
                {nameOf(color)}
              </SheetDescription>
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label={t.common.close}
                  className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-md hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)] focus-visible:outline-2 focus-visible:outline-current"
                >
                  <X className="size-4" />
                </button>
              </SheetClose>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <Segmented
                label={nameOf(color)}
                size="sm"
                value={tab}
                onChange={setTab}
                options={DRAWER_TABS.map((id) => ({ value: id, label: t.drawer.tabs[id] }))}
                className="gap-x-4"
              />
              {tab === "formats" && <FormatsTab hex={color.hex} />}
              {tab === "variations" && (
                <VariationsTab context={{ target: color, targetName: nameOf(color), isFull: colorCount >= MAX_COLORS }} />
              )}
              {tab === "harmonies" && (
                <HarmoniesTab context={{ target: color, targetName: nameOf(color), isFull: colorCount >= MAX_COLORS }} />
              )}
              {tab === "vision" && <VisionTab hex={color.hex} />}
              {tab === "meaning" && <MeaningTab hex={color.hex} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
