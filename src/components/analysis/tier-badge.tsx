"use client";

import { ALargeSmall, Check, CheckCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/i18n/context";
import type { ContrastMode, ContrastTier } from "@/lib/color/contrast";

/** One icon per tier, so the level never depends on color alone. */
export const TIER_ICONS = [X, ALargeSmall, Check, CheckCheck] as const;

export function TierBadge({ mode, tier }: { mode: ContrastMode; tier: ContrastTier }) {
  const t = useT();
  const Icon = TIER_ICONS[tier];
  return (
    <Badge variant={tier >= 2 ? "default" : tier === 1 ? "secondary" : "outline"}>
      <Icon />
      {t.tiers.badges[mode][tier]}
    </Badge>
  );
}
