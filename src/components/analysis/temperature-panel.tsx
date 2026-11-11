"use client";

import { Panel } from "@/components/panel";
import { SourceLink } from "@/components/source-link";
import { SwatchLabel } from "@/components/swatch-label";
import { useLocale, useT } from "@/i18n/context";
import { formatPercent } from "@/i18n/locales";
import {
  classifyTemperature,
  temperatureBalance,
  warmth,
  WARMTH_SCALE_MAX,
  type Temperature,
} from "@/lib/color/temperature";
import type { PaletteColor } from "@/lib/color/types";
import { REFERENCES } from "@/lib/references";
import { cn } from "@/lib/utils";

const SEGMENT_STYLES: Record<Temperature, string> = {
  cool: "bg-sky-500/25",
  neutral: "bg-muted",
  warm: "bg-amber-500/30",
};

/** Position on the cool–warm scale in percent, 50 being neutral. */
function scalePosition(hex: string): number {
  const clamped = Math.max(-1, Math.min(1, warmth(hex) / WARMTH_SCALE_MAX));
  return 50 + clamped * 50;
}

interface TemperaturePanelProps {
  colors: PaletteColor[];
  nameOf: (color: PaletteColor) => string;
}

export function TemperaturePanel({ colors, nameOf }: TemperaturePanelProps) {
  const t = useT();
  const locale = useLocale();
  const labels = t.temperature.labels;
  const balance = temperatureBalance(colors.map((color) => color.hex));
  const segments = (["cool", "neutral", "warm"] as const).filter((temperature) => balance[temperature] > 0);

  return (
    <div>
      <Panel title={t.temperature.balance}>
        <div className="flex h-10 overflow-hidden rounded-md ring-1 ring-foreground/15">
          {segments.map((temperature) => (
            <div
              key={temperature}
              className={cn(
                "flex min-w-fit items-center justify-center px-3 text-sm font-semibold whitespace-nowrap",
                SEGMENT_STYLES[temperature],
              )}
              style={{ flexGrow: balance[temperature] }}
            >
              {labels[temperature]} {formatPercent(locale, balance[temperature])}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={t.temperature.each}>
        <div className="grid grid-cols-[minmax(5rem,11rem)_1fr_4.5rem] items-center gap-x-4 gap-y-2 text-sm">
          <span />
          <div className="flex justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <span>{labels.cool}</span>
            <span>{labels.neutral}</span>
            <span>{labels.warm}</span>
          </div>
          <span />
          {colors.map((color) => (
            <div key={color.id} className="contents">
              <SwatchLabel hex={color.hex}>{nameOf(color)}</SwatchLabel>
              <div className="relative h-6" aria-hidden="true">
                <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/25" />
                <div className="absolute top-1 bottom-1 left-1/2 w-px bg-foreground/25" />
                <span
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-foreground"
                  style={{ left: `${scalePosition(color.hex)}%`, backgroundColor: color.hex }}
                />
              </div>
              <span className="text-muted-foreground">{labels[classifyTemperature(color.hex)]}</span>
            </div>
          ))}
        </div>
      </Panel>

      <p className="border-t border-border pt-5 text-xs text-muted-foreground">
        {t.temperature.note(<SourceLink reference={REFERENCES.colorHeat} />)}
      </p>
    </div>
  );
}
