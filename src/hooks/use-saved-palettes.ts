import { useSyncExternalStore } from "react";
import { createId } from "@/lib/color/hex";
import type { PaletteEntry } from "@/lib/color/types";
import { MAX_TITLE_LENGTH, readSavedPalettes, writeSavedPalettes, type SavedPalette } from "@/lib/storage";

const EMPTY: SavedPalette[] = [];
let cached: SavedPalette[] | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SavedPalette[] {
  cached ??= readSavedPalettes();
  return cached;
}

function store(next: SavedPalette[]): boolean {
  if (!writeSavedPalettes(next)) return false;
  cached = next;
  listeners.forEach((listener) => listener());
  return true;
}

/** Palettes saved in this browser's localStorage, newest first. */
export function useSavedPalettes() {
  const palettes = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  return {
    palettes,
    /** Returns false when the browser could not store the palette. */
    save(title: string, colors: PaletteEntry[]): boolean {
      const entry: SavedPalette = {
        id: createId(),
        title: title.trim().slice(0, MAX_TITLE_LENGTH),
        colors: colors.map(({ hex, name }) => ({ hex, name })),
        savedAt: Date.now(),
      };
      return store([entry, ...getSnapshot()]);
    },
    remove(id: string): boolean {
      return store(getSnapshot().filter((palette) => palette.id !== id));
    },
    /** Puts a removed palette back in its place by date. */
    restore(palette: SavedPalette): boolean {
      return store([...getSnapshot(), palette].sort((a, b) => b.savedAt - a.savedAt));
    },
  };
}
