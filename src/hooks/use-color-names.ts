import { useSyncExternalStore } from "react";
import { colorNamesLoaded, subscribeToColorNames, suggestName } from "@/lib/color/naming";
import type { PaletteColor } from "@/lib/color/types";

/** Returns a resolver for display names: the custom name, else the suggested one, else the hex code while names load. */
export function useColorNames(): (color: Pick<PaletteColor, "hex" | "name">) => string {
  useSyncExternalStore(subscribeToColorNames, colorNamesLoaded, () => false);
  return (color) => color.name || suggestName(color.hex) || color.hex.slice(1).toUpperCase();
}

/** The suggested name for a single color, or null while the list loads. */
export function useSuggestedName(hex: string): string | null {
  useSyncExternalStore(subscribeToColorNames, colorNamesLoaded, () => false);
  return suggestName(hex);
}
