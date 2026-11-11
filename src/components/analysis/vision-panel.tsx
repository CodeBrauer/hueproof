"use client";

import { CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { FixButton } from "@/components/analysis/fix-button";
import { Panel } from "@/components/panel";
import { SourceLink } from "@/components/source-link";
import { SwatchLabel } from "@/components/swatch-label";
import { useT } from "@/i18n/context";
import {
  CONFUSABLE_BELOW,
  largestSafeSet,
  MARGINAL_BELOW,
  type PairCategory,
  type PairDifference,
} from "@/lib/color/difference";
import { fixConfusablePair } from "@/lib/color/fix";
import { displayHex } from "@/lib/color/hex";
import type { PaletteColor } from "@/lib/color/types";
import { simulate, VISION_GROUPS, VISION_TYPES, type VisionGroup, type VisionId } from "@/lib/color/vision";
import { REFERENCES } from "@/lib/references";
import { cn } from "@/lib/utils";

/** Each category has a symbol as well as a tint, so the matrix itself does not rely on color. */
const CATEGORY_STYLES: Record<PairCategory, { symbol: string; className: string }> = {
  confusable: { symbol: "✕", className: "bg-red-500/15 font-semibold text-red-800 dark:text-red-200" },
  marginal: { symbol: "≈", className: "bg-amber-500/15 text-amber-900 dark:text-amber-100" },
  distinct: { symbol: "", className: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100" },
};

function Stat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="font-display text-4xl leading-tight">{value}</dd>
    </div>
  );
}

function ConfusablePair({
  colors,
  nameOf,
  pair,
}: {
  colors: PaletteColor[];
  nameOf: (color: PaletteColor) => string;
  pair: PairDifference;
}) {
  const t = useT();
  const options = useMemo(() => {
    const hexes = colors.map((color) => color.hex);
    return [
      [pair.a, pair.b],
      [pair.b, pair.a],
    ].flatMap(([adjust, partner]) => {
      const color = colors[adjust];
      if (color.locked) return [];
      const fix = fixConfusablePair(hexes, adjust, partner);
      return fix ? [{ color, fix }] : [];
    });
  }, [colors, pair]);

  const first = colors[pair.a];
  const second = colors[pair.b];
  return (
    <li className="space-y-2">
      <p className="flex items-center gap-3 text-sm">
        <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/20" aria-hidden="true">
          <span className="h-6 w-5" style={{ backgroundColor: first.hex }} />
          <span className="h-6 w-5" style={{ backgroundColor: second.hex }} />
        </span>
        <span>
          {t.vision.pairLine(
            nameOf(first),
            nameOf(second),
            <span className="tabular-nums">{t.decimal(pair.worst.toFixed(1))}</span>,
            t.vision.types[pair.worstVision].label,
          )}
        </span>
      </p>
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map(({ color, fix }) => (
            <FixButton key={color.id} colorId={color.id} label={nameOf(color)} hex={color.hex} fix={fix} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.vision.noFix}</p>
      )}
    </li>
  );
}

interface VisionPanelProps {
  colors: PaletteColor[];
  nameOf: (color: PaletteColor) => string;
  pairs: PairDifference[];
  vision: VisionId;
  onVisionChange: (vision: VisionId) => void;
}

export function VisionPanel({ colors, nameOf, pairs, vision, onVisionChange }: VisionPanelProps) {
  const t = useT();
  const confusable = pairs.filter((pair) => pair.category === "confusable");
  const safeSet = useMemo(() => largestSafeSet(colors.length, pairs), [colors.length, pairs]);
  const closest = pairs.reduce((min, pair) => Math.min(min, pair.worst), Infinity);
  const pairAt = (a: number, b: number) => pairs.find((pair) => pair.a === Math.min(a, b) && pair.b === Math.max(a, b));

  // How common each group is, by sex where the figures differ.
  const { prevalence } = t.vision;
  const frequency: Record<Exclude<VisionGroup, "typical">, { shares: { label: string; value: string }[]; note: string }> = {
    redGreen: {
      shares: [
        { label: prevalence.men, value: prevalence.redGreen.men },
        { label: prevalence.women, value: prevalence.redGreen.women },
      ],
      note: prevalence.redGreen.note,
    },
    blueYellow: {
      shares: [{ label: prevalence.everyone, value: prevalence.blueYellow.everyone }],
      note: prevalence.blueYellow.note,
    },
    monochromacy: {
      shares: [{ label: prevalence.everyone, value: prevalence.monochromacy.everyone }],
      note: prevalence.monochromacy.note,
    },
  };

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-border py-6 md:grid-cols-4">
        <Stat label={t.vision.stats.checked} value={pairs.length} />
        <Stat label={t.vision.stats.confusable} value={confusable.length} />
        <Stat
          label={t.vision.stats.safeSet}
          value={
            <>
              {safeSet.length}
              <span className="text-2xl text-muted-foreground"> / {colors.length}</span>
            </>
          }
        />
        <Stat label={t.vision.stats.closest} value={Number.isFinite(closest) ? t.decimal(closest.toFixed(1)) : "–"} />
      </dl>

      <Panel title={t.vision.looksTitle} description={t.vision.looksText}>
        <div className="space-y-5">
          {VISION_GROUPS.map((group) => (
            <div key={group} className="space-y-1.5">
              {group !== "typical" && (
                <div className="space-y-0.5 border-t border-border pt-4">
                  <h4 className="text-sm">
                    <span className="font-semibold">{t.vision.groups[group]}</span>
                    {frequency[group].shares.map((share) => (
                      <span key={share.label} className="text-muted-foreground">
                        {" · "}
                        {share.label} <span className="font-semibold text-foreground">{share.value}</span>
                      </span>
                    ))}
                  </h4>
                  <p className="text-xs text-muted-foreground">{frequency[group].note}</p>
                </div>
              )}
              <ul className="space-y-1">
                {VISION_TYPES.filter((type) => type.group === group).map((type) => (
                  <li key={type.id}>
                    <button
                      type="button"
                      aria-pressed={vision === type.id}
                      onClick={() => onVisionChange(type.id)}
                      className="group grid w-full grid-cols-[9rem_1fr] sm:grid-cols-[17rem_1fr] items-center gap-4 rounded-md py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate text-sm font-semibold underline-offset-[5px] group-hover:underline",
                            vision === type.id && "underline decoration-2",
                          )}
                        >
                          {t.vision.types[type.id].label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {t.vision.types[type.id].description}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "flex h-9 overflow-hidden rounded-md ring-1 ring-foreground/15",
                          vision === type.id && "ring-2 ring-foreground",
                        )}
                      >
                        {colors.map((color) => {
                          const simulated = simulate(color.hex, type.id);
                          return (
                            <span
                              key={color.id}
                              className="flex-1"
                              style={{ backgroundColor: simulated }}
                              title={t.vision.appearsAs(
                                nameOf(color),
                                `#${displayHex(color.hex)}`,
                                `#${displayHex(simulated)}`,
                              )}
                            />
                          );
                        })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            <p>{prevalence.age(<SourceLink reference={REFERENCES.colorVisionAndAge} />)}</p>
            <p>
              {prevalence.sources(
                <SourceLink reference={REFERENCES.prevalence} />,
                <SourceLink reference={REFERENCES.prevalenceAchromatopsia} />,
                <SourceLink reference={REFERENCES.prevalenceByPopulation} />,
              )}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title={t.vision.pairsTitle} description={t.vision.pairsText}>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1.5 text-sm">
            <caption className="sr-only">{t.vision.matrixCaption}</caption>
            <thead>
              <tr>
                <td />
                {colors.map((color) => (
                  <th key={color.id} scope="col" className="p-0">
                    <span
                      className="block h-8 min-w-14 rounded-md ring-1 ring-foreground/15"
                      style={{ backgroundColor: color.hex }}
                      title={nameOf(color)}
                    />
                    <span className="sr-only">{nameOf(color)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((rowColor, row) => (
                <tr key={rowColor.id}>
                  <th scope="row" className="max-w-32 pr-2 text-left font-medium">
                    <SwatchLabel hex={rowColor.hex} className="max-w-full">
                      {nameOf(rowColor)}
                    </SwatchLabel>
                  </th>
                  {colors.map((columnColor, column) => {
                    const pair = pairAt(row, column);
                    if (!pair) return <td key={columnColor.id} className="rounded-md bg-muted/60" />;
                    const style = CATEGORY_STYLES[pair.category];
                    const category = t.vision.categories[pair.category];
                    return (
                      <td
                        key={columnColor.id}
                        className={cn(
                          "h-9 rounded-md px-2 text-center text-[13px] whitespace-nowrap tabular-nums",
                          style.className,
                        )}
                        title={t.vision.cellTitle(category, t.vision.types[pair.worstVision].label)}
                      >
                        {style.symbol && <span aria-hidden="true">{style.symbol} </span>}
                        {t.decimal(pair.worst.toFixed(1))}
                        <span className="sr-only">, {category}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li>{t.vision.legend.confusable(CONFUSABLE_BELOW)}</li>
          <li>{t.vision.legend.marginal(MARGINAL_BELOW)}</li>
          <li>{t.vision.legend.distinct}</li>
        </ul>
      </Panel>

      <Panel title={t.vision.fixTitle} description={confusable.length > 0 ? t.vision.fixText : undefined}>
        {confusable.length > 0 ? (
          <ul className="space-y-4">
            {confusable.map((pair) => (
              <ConfusablePair key={`${pair.a}-${pair.b}`} colors={colors} nameOf={nameOf} pair={pair} />
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm">
            <CircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            {t.vision.nothingToFix}
          </p>
        )}
      </Panel>

      <Panel
        title={t.vision.safeTitle}
        description={safeSet.length === colors.length ? t.vision.safeAll : t.vision.safeSome(safeSet.length, colors.length)}
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {safeSet.map((index) => (
            <li key={colors[index].id}>
              <SwatchLabel hex={colors[index].hex}>{nameOf(colors[index])}</SwatchLabel>
            </li>
          ))}
        </ul>
      </Panel>

      <p className="border-t border-border pt-5 text-xs text-muted-foreground">
        {t.vision.method(
          <SourceLink reference={REFERENCES.visionModel} />,
          <SourceLink reference={REFERENCES.colorDifference} />,
          CONFUSABLE_BELOW,
          MARGINAL_BELOW,
        )}
      </p>
    </div>
  );
}
