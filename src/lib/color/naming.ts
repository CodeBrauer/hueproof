import { converter } from "culori";

interface NamedColor {
  name: string;
  l: number;
  a: number;
  b: number;
}

const toOklab = converter("oklab");

let entries: NamedColor[] | null = null;
let loading: Promise<void> | null = null;
const cache = new Map<string, string>();
const listeners = new Set<() => void>();

/** Loads the name list on demand; it is too large to ship with the first paint. */
export function loadColorNames(): Promise<void> {
  loading ??= import("color-name-list/bestof").then(({ colornames }) => {
    entries = colornames.map(({ name, hex }) => {
      const { l, a, b } = toOklab(hex)!;
      return { name, l, a, b };
    });
    listeners.forEach((listener) => listener());
  });
  return loading;
}

export function subscribeToColorNames(listener: () => void): () => void {
  listeners.add(listener);
  void loadColorNames();
  return () => listeners.delete(listener);
}

export function colorNamesLoaded(): boolean {
  return entries !== null;
}

/** Name of the perceptually closest listed color, or null while the list is still loading. */
export function suggestName(hex: string): string | null {
  if (!entries) return null;
  const cached = cache.get(hex);
  if (cached) return cached;

  const { l, a, b } = toOklab(hex)!;
  let best = entries[0];
  let bestDistance = Infinity;
  for (const entry of entries) {
    const distance = (entry.l - l) ** 2 + (entry.a - a) ** 2 + (entry.b - b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  cache.set(hex, best.name);
  return best.name;
}
