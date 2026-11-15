import { useSyncExternalStore } from "react";
import { readOmitSmallInk, writeOmitSmallInk } from "@/lib/storage";

let cached: boolean | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  cached ??= readOmitSmallInk();
  return cached;
}

/** Whether CMYK values leave out small ink percentages; remembered in this browser's localStorage. */
export function useOmitSmallInk(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return [
    value,
    (next) => {
      // Still applies for this visit when the browser refuses to store it.
      writeOmitSmallInk(next);
      cached = next;
      listeners.forEach((listener) => listener());
    },
  ];
}
