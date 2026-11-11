"use client";

import { useMemo, useState } from "react";
import { FixButton } from "@/components/analysis/fix-button";
import { TIER_ICONS, TierBadge } from "@/components/analysis/tier-badge";
import { Field, Panel } from "@/components/panel";
import { Choice, Segmented } from "@/components/segmented";
import { SourceLink } from "@/components/source-link";
import { SwatchLabel } from "@/components/swatch-label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/i18n/context";
import {
  CONTRAST_THRESHOLDS,
  contrastTier,
  contrastValue,
  formatContrast,
  formatThreshold,
  nearMissTarget,
  readableOn,
  type ContrastMode,
  type ContrastTier,
} from "@/lib/color/contrast";
import { fixContrast } from "@/lib/color/fix";
import type { PaletteColor } from "@/lib/color/types";
import { REFERENCES } from "@/lib/references";
import { cn } from "@/lib/utils";

interface Sample {
  key: string;
  hex: string;
  label: string;
  /** Set for palette colors that may be changed by a fix (not white, black or locked colors). */
  adjustableId: string | null;
}

function FixOptions({
  mode,
  text,
  background,
  target,
}: {
  mode: ContrastMode;
  text: Sample;
  background: Sample;
  target: number;
}) {
  const t = useT();
  const options = useMemo(
    () =>
      (["text", "background"] as const).flatMap((side) => {
        const sample = side === "text" ? text : background;
        if (!sample.adjustableId) return [];
        const fix = fixContrast(mode, text.hex, background.hex, target, side);
        return fix ? [{ sample, colorId: sample.adjustableId, fix }] : [];
      }),
    [mode, text, background, target],
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t.contrast.noFix(t.decimal(formatThreshold(mode, target)))}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ sample, colorId, fix }) => (
        <FixButton key={sample.key} colorId={colorId} label={sample.label} hex={sample.hex} fix={fix} />
      ))}
    </div>
  );
}

function PairDetails({ mode, text, background }: { mode: ContrastMode; text: Sample; background: Sample }) {
  const t = useT();
  const value = contrastValue(mode, text.hex, background.hex);
  const tier = contrastTier(mode, value);
  const unmet = CONTRAST_THRESHOLDS[mode].filter((threshold) => value < threshold);
  const [chosenTarget, setChosenTarget] = useState<number | null>(null);
  const target = chosenTarget !== null && unmet.includes(chosenTarget) ? chosenTarget : unmet[0];

  return (
    <div className="space-y-3">
      <div className="rounded-lg p-3" style={{ backgroundColor: background.hex, color: text.hex }}>
        <p className="text-2xl leading-tight font-semibold">{t.contrast.largeText}</p>
        <p className="text-sm">{t.contrast.bodySample}</p>
      </div>
      <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
        {t.contrast.pair(
          <SwatchLabel hex={text.hex}>{text.label}</SwatchLabel>,
          <SwatchLabel hex={background.hex}>{background.label}</SwatchLabel>,
        )}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="tabular-nums text-lg font-semibold">{t.decimal(formatContrast(mode, value))}</span>
        <TierBadge mode={mode} tier={tier} />
      </div>
      <p className="text-xs text-muted-foreground">{t.tiers.descriptions[tier]}</p>

      {target === undefined ? (
        <p className="text-sm">{t.contrast.meetsHighest}</p>
      ) : (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.contrast.fixToReach}</span>
            <Segmented
              label={t.contrast.fixToReach}
              size="sm"
              value={String(target)}
              onChange={(next) => setChosenTarget(Number(next))}
              options={unmet.map((threshold) => ({
                value: String(threshold),
                label: t.decimal(formatThreshold(mode, threshold)),
              }))}
            />
          </div>
          <FixOptions mode={mode} text={text} background={background} target={target} />
        </div>
      )}
    </div>
  );
}

function PairPopover({
  mode,
  text,
  background,
  children,
}: {
  mode: ContrastMode;
  text: Sample;
  background: Sample;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <PairDetails mode={mode} text={text} background={background} />
      </PopoverContent>
    </Popover>
  );
}

function Matrix({ mode, samples }: { mode: ContrastMode; samples: Sample[] }) {
  const t = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1.5 text-sm">
        <caption className="sr-only">{t.contrast.matrixCaption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-px pr-2 text-left text-xs font-normal whitespace-nowrap text-muted-foreground">
              {t.contrast.matrixCorner}
            </th>
            {samples.map((background) => (
              <th key={background.key} scope="col" className="max-w-24 min-w-20 pb-1 font-medium">
                <SwatchLabel hex={background.hex} className="max-w-full">
                  {background.label}
                </SwatchLabel>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {samples.map((text) => (
            <tr key={text.key}>
              <th scope="row" className="max-w-36 pr-2 text-left font-medium">
                <SwatchLabel hex={text.hex} className="max-w-full">
                  {text.label}
                </SwatchLabel>
              </th>
              {samples.map((background) => {
                if (text.key === background.key) return <td key={background.key} className="rounded-md bg-muted/60" />;
                const value = contrastValue(mode, text.hex, background.hex);
                const tier = contrastTier(mode, value);
                const TierIcon = TIER_ICONS[tier];
                const chipBackground = readableOn(background.hex);
                const shownValue = t.decimal(formatContrast(mode, value));
                return (
                  <td key={background.key} className="p-0">
                    <PairPopover mode={mode} text={text} background={background}>
                      <button
                        type="button"
                        aria-label={t.contrast.cellLabel(text.label, background.label, shownValue, t.tiers.badges[mode][tier])}
                        className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md ring-1 ring-foreground/15 transition hover:ring-2 hover:ring-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                        style={{ backgroundColor: background.hex, color: text.hex }}
                      >
                        <span className="text-lg leading-none font-semibold">Aa</span>
                        <span
                          className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-px text-[11px] leading-4 font-medium tabular-nums"
                          style={{ backgroundColor: chipBackground, color: readableOn(chipBackground) }}
                        >
                          <TierIcon className="size-3" aria-hidden="true" />
                          {shownValue}
                        </span>
                      </button>
                    </PairPopover>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CARD_GROUPS: readonly { key: "any" | "large" | "none"; tiers: readonly ContrastTier[] }[] = [
  { key: "any", tiers: [2, 3] },
  { key: "large", tiers: [1] },
  { key: "none", tiers: [0] },
];

function Cards({ mode, samples }: { mode: ContrastMode; samples: Sample[] }) {
  const t = useT();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {samples.map((background) => {
        const ink = readableOn(background.hex);
        const rated = samples
          .filter((text) => text.key !== background.key)
          .map((text) => {
            const value = contrastValue(mode, text.hex, background.hex);
            return { text, value, tier: contrastTier(mode, value) };
          });
        return (
          <section
            key={background.key}
            className="space-y-3 rounded-lg p-4 ring-1 ring-foreground/15"
            style={{ backgroundColor: background.hex, color: ink }}
          >
            <h4 className="font-display text-base">{background.label}</h4>
            {CARD_GROUPS.map(({ key, tiers }) => {
              const rows = rated.filter((row) => tiers.includes(row.tier));
              if (rows.length === 0) return null;
              const readable = tiers[0] > 0;
              return (
                <div key={key} className="space-y-1">
                  <p
                    className="rounded-[5px] px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: ink, color: readableOn(ink) }}
                  >
                    {t.contrast.cardGroups[key]}
                  </p>
                  {rows.map(({ text, value }) => (
                    <PairPopover key={text.key} mode={mode} text={text} background={background}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)] focus-visible:outline-2 focus-visible:outline-current",
                          tiers[0] === 1 && "text-lg font-semibold",
                        )}
                        // Pairs without enough contrast are labelled in a readable color instead of their own.
                        style={{ color: readable ? text.hex : ink }}
                      >
                        <SwatchLabel hex={text.hex}>{text.label}</SwatchLabel>
                        <span className="tabular-nums text-sm">{t.decimal(formatContrast(mode, value))}</span>
                      </button>
                    </PairPopover>
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

interface ContrastPanelProps {
  colors: PaletteColor[];
  nameOf: (color: PaletteColor) => string;
}

export function ContrastPanel({ colors, nameOf }: ContrastPanelProps) {
  const t = useT();
  const [mode, setMode] = useState<ContrastMode>("wcag");
  const [view, setView] = useState<"matrix" | "cards">("matrix");
  const [includeExtremes, setIncludeExtremes] = useState(false);

  const samples: Sample[] = [
    ...colors.map((color) => ({
      key: color.id,
      hex: color.hex,
      label: nameOf(color),
      adjustableId: color.locked ? null : color.id,
    })),
    ...(includeExtremes
      ? [
          { key: "white", hex: "#ffffff", label: t.contrast.white, adjustableId: null },
          { key: "black", hex: "#000000", label: t.contrast.black, adjustableId: null },
        ]
      : []),
  ];

  const nearMisses = samples.flatMap((text, textIndex) =>
    samples.flatMap((background, backgroundIndex) => {
      if (textIndex === backgroundIndex) return [];
      // WCAG ratios are symmetric, so each pair is listed once.
      if (mode === "wcag" && textIndex > backgroundIndex) return [];
      if (!text.adjustableId && !background.adjustableId) return [];
      const value = contrastValue(mode, text.hex, background.hex);
      const target = nearMissTarget(mode, value);
      return target === null ? [] : [{ text, background, value, target }];
    }),
  );

  return (
    <div>
      <Field label={t.contrast.method}>
        <Segmented
          label={t.contrast.method}
          value={mode}
          onChange={setMode}
          options={[
            { value: "wcag", label: "WCAG 2" },
            { value: "apca", label: "APCA" },
          ]}
        />
      </Field>
      <Field label={t.contrast.layout}>
        <Segmented
          label={t.contrast.layout}
          value={view}
          onChange={setView}
          options={[
            { value: "matrix", label: t.contrast.matrix },
            { value: "cards", label: t.contrast.cards },
          ]}
        />
      </Field>
      <Field label={t.contrast.extras}>
        <Choice pressed={includeExtremes} onClick={() => setIncludeExtremes(!includeExtremes)}>
          {t.contrast.includeExtremes}
        </Choice>
      </Field>

      {nearMisses.length > 0 && (
        <Panel title={t.contrast.closeCalls} description={t.contrast.closeCallsText}>
          <ul className="space-y-3">
            {nearMisses.map(({ text, background, value, target }) => (
              <li key={`${text.key}-${background.key}`} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span
                  className="rounded-md px-3 py-1 font-semibold ring-1 ring-foreground/15"
                  style={{ backgroundColor: background.hex, color: text.hex }}
                >
                  Aa
                </span>
                <span className="text-sm">
                  {t.contrast.nearMiss(
                    text.label,
                    background.label,
                    <span className="tabular-nums">{t.decimal(formatContrast(mode, value))}</span>,
                    <span className="tabular-nums">{t.decimal(formatThreshold(mode, target))}</span>,
                    mode === "wcag",
                  )}
                </span>
                <FixOptions mode={mode} text={text} background={background} target={target} />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel wide title={t.contrast.allPairs} description={t.contrast.notes[mode]}>
        {view === "matrix" ? <Matrix mode={mode} samples={samples} /> : <Cards mode={mode} samples={samples} />}
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {TIER_ICONS.map((Icon, tier) => (
              <li key={tier} className="inline-flex items-center gap-1">
                <Icon className="size-3.5" aria-hidden="true" />
                {t.contrast.legendItem(t.tiers.badges[mode][tier], t.tiers.descriptions[tier])}
              </li>
            ))}
          </ul>
          <p>
            {t.contrast.selectCell(
              <SourceLink reference={mode === "wcag" ? REFERENCES.wcagContrast : REFERENCES.apca} />,
            )}
          </p>
        </div>
      </Panel>
    </div>
  );
}
