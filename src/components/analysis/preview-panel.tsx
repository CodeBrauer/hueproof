"use client";

import { useState } from "react";
import { BusinessCardVisual, PatternVisual, SlideVisual, type VisualColors } from "@/components/analysis/key-visuals";
import { TierBadge } from "@/components/analysis/tier-badge";
import { Field, Panel } from "@/components/panel";
import { SwatchLabel } from "@/components/swatch-label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/i18n/context";
import { contrastTier, formatContrast, wcagRatio } from "@/lib/color/contrast";
import { bestOn, ROLES, suggestRoles, type Role } from "@/lib/color/roles";
import type { PaletteColor } from "@/lib/color/types";

interface PreviewPanelProps {
  colors: PaletteColor[];
  nameOf: (color: PaletteColor) => string;
}

export function PreviewPanel({ colors, nameOf }: PreviewPanelProps) {
  const t = useT();
  const [overrides, setOverrides] = useState<Partial<Record<Role, string>>>({});

  const suggested = suggestRoles(colors.map((color) => color.hex));
  const colorFor = (role: Role): PaletteColor =>
    colors.find((color) => color.id === overrides[role]) ?? colors[suggested[role]];

  const background = colorFor("background").hex;
  const text = colorFor("text").hex;
  const primary = colorFor("primary").hex;
  const accent = colorFor("accent").hex;
  const visual: VisualColors = {
    background,
    surface: colorFor("surface").hex,
    text,
    primary,
    accent,
    onPrimary: bestOn(primary, [background, text]),
    onAccent: bestOn(accent, [background, text]),
    all: colors.map((color) => color.hex),
  };

  const checks: readonly { label: string; foreground: string; behind: string }[] = [
    { label: t.preview.checks.textOnBackground, foreground: text, behind: background },
    { label: t.preview.checks.textOnSurface, foreground: text, behind: visual.surface },
    { label: t.preview.checks.buttonLabel, foreground: visual.onPrimary, behind: primary },
    { label: t.preview.checks.link, foreground: primary, behind: background },
    { label: t.preview.checks.badgeLabel, foreground: visual.onAccent, behind: accent },
  ];

  const visuals = [
    { caption: t.preview.visuals.card, Visual: BusinessCardVisual },
    { caption: t.preview.visuals.slide, Visual: SlideVisual },
    { caption: t.preview.visuals.pattern, Visual: PatternVisual },
  ];

  return (
    <div>
      <Field label={t.preview.rolesLabel}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm text-muted-foreground">
              {t.preview.roles[role]}
              <Select
                value={colorFor(role).id}
                onValueChange={(id) => setOverrides((previous) => ({ ...previous, [role]: id }))}
              >
                <SelectTrigger
                  aria-label={t.preview.roles[role]}
                  className="gap-1.5 border-0 bg-transparent px-1 font-semibold text-foreground data-[size=default]:h-8 dark:bg-transparent"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={6}>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <SwatchLabel hex={color.hex}>{nameOf(color)}</SwatchLabel>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={Object.keys(overrides).length === 0}
            onClick={() => setOverrides({})}
          >
            {t.preview.resetRoles}
          </Button>
        </div>
      </Field>

      <div className="grid gap-x-6 gap-y-8 border-t border-border py-7 md:grid-cols-2 lg:grid-cols-3">
        {visuals.map(({ caption, Visual }) => (
          <figure key={caption}>
            <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
              <Visual colors={visual} texts={t.preview} />
            </div>
            <figcaption className="pt-3 font-display text-lg leading-tight">{caption}</figcaption>
          </figure>
        ))}
      </div>

      <Panel title={t.preview.checksTitle} description={t.preview.note}>
        <ul className="grid gap-x-10 text-sm sm:grid-cols-2">
          {checks.map(({ label, foreground, behind }) => {
            const ratio = wcagRatio(foreground, behind);
            return (
              <li key={label} className="flex items-center justify-between gap-3 border-b border-border py-2">
                <span className="flex items-center gap-2.5">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ring-1 ring-foreground/15"
                    style={{ backgroundColor: behind, color: foreground }}
                    aria-hidden="true"
                  >
                    Aa
                  </span>
                  {label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">{t.decimal(formatContrast("wcag", ratio))}</span>
                  <TierBadge mode="wcag" tier={contrastTier("wcag", ratio)} />
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
