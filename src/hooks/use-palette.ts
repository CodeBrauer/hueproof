import { useSyncExternalStore } from "react";
import { getPaletteSnapshot, subscribeToPalette, type PaletteSnapshot } from "@/lib/palette-store";

/** The current palette, or null during prerendering and the first client render. */
export function usePalette(): PaletteSnapshot | null {
  return useSyncExternalStore(subscribeToPalette, getPaletteSnapshot, () => null);
}
