import { generateColors, midpoint } from "./color/generate";
import { createId, normalizeHex, sanitizeName } from "./color/hex";
import {
  DEFAULT_PALETTE,
  MAX_COLORS,
  MIN_COLORS,
  type PaletteColor,
  type PaletteEntry,
} from "./color/types";
import { parsePalette, serializePalette } from "./color/url";

/**
 * The palette lives in the URL fragment and in the browser history: every change is a
 * history entry, so the back button undoes it and any state can be shared as a link.
 * A fragment is never sent to a server.
 */

export interface PaletteSnapshot {
  colors: PaletteColor[];
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryEntry {
  index: number;
  colors: PaletteColor[];
}

type HistoryMode = "push" | "replace" | { burst: string };

const HISTORY_KEY = "hueproof";
/** Rapid changes (dragging the picker) are folded into one history entry once they pause this long. */
const BURST_IDLE_MS = 400;

let snapshot: PaletteSnapshot | null = null;
let index = 0;
let lastIndex = 0;
let burstKey: string | null = null;
let burstTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/** Without a palette in the link, the page starts with fresh colors, as many as the default palette has. */
function randomPalette(): PaletteEntry[] {
  return generateColors(DEFAULT_PALETTE.map(({ hex }) => ({ hex, locked: false }))).map((hex) => ({ hex, name: "" }));
}

function hydrate(entries: PaletteEntry[]): PaletteColor[] {
  return entries.map((entry) => ({ id: createId(), hex: entry.hex, name: entry.name, locked: false }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** History state survives reloads and can come from older versions, so it is validated like any input. */
function readEntry(state: unknown): HistoryEntry | null {
  const entry = isRecord(state) ? state[HISTORY_KEY] : null;
  if (!isRecord(entry) || typeof entry.index !== "number" || !Array.isArray(entry.colors)) return null;
  const colors = entry.colors.flatMap((color): PaletteColor[] => {
    if (!isRecord(color) || typeof color.id !== "string" || typeof color.hex !== "string") return [];
    const hex = normalizeHex(color.hex);
    if (!hex) return [];
    return [
      {
        id: color.id,
        hex,
        name: sanitizeName(typeof color.name === "string" ? color.name : ""),
        locked: color.locked === true,
      },
    ];
  });
  if (colors.length < MIN_COLORS || colors.length > MAX_COLORS) return null;
  return { index: entry.index, colors };
}

/** The palette in the address bar: the fragment, or the query string of an older link. */
function readUrl(): PaletteEntry[] | null {
  return parsePalette(window.location.hash) ?? parsePalette(window.location.search);
}

function publish(colors: PaletteColor[]): void {
  snapshot = { colors, canUndo: index > 0, canRedo: index < lastIndex };
  listeners.forEach((listener) => listener());
}

function writeHistory(method: "pushState" | "replaceState", colors: PaletteColor[]): void {
  const entry: HistoryEntry = { index, colors };
  const url = `${window.location.pathname}#${serializePalette(colors)}`;
  window.history[method]({ [HISTORY_KEY]: entry }, "", url);
}

function endBurst(): void {
  if (!burstTimer) return;
  clearTimeout(burstTimer);
  burstTimer = null;
  burstKey = null;
  if (snapshot) writeHistory("replaceState", snapshot.colors);
}

function pushEntry(colors: PaletteColor[]): void {
  index += 1;
  lastIndex = index;
  writeHistory("pushState", colors);
}

function commit(colors: PaletteColor[], mode: HistoryMode): void {
  if (mode === "push") {
    endBurst();
    pushEntry(colors);
  } else if (mode === "replace") {
    writeHistory("replaceState", colors);
  } else {
    // Browsers throttle history writes, so a burst writes once at its start and once when it settles.
    if (burstKey !== mode.burst) {
      endBurst();
      burstKey = mode.burst;
      pushEntry(colors);
    }
    if (burstTimer) clearTimeout(burstTimer);
    burstTimer = setTimeout(endBurst, BURST_IDLE_MS);
  }
  publish(colors);
}

function onPopState(event: PopStateEvent): void {
  if (burstTimer) clearTimeout(burstTimer);
  burstTimer = null;
  burstKey = null;

  const entry = readEntry(event.state);
  if (entry) {
    index = entry.index;
    lastIndex = Math.max(lastIndex, index);
    publish(entry.colors);
    return;
  }
  index = 0;
  publish(hydrate(readUrl() ?? randomPalette()));
}

function initialise(): void {
  if (snapshot || typeof window === "undefined") return;
  const entry = readEntry(window.history.state);
  if (entry) {
    index = entry.index;
    lastIndex = index;
    publish(entry.colors);
  } else {
    const colors = hydrate(readUrl() ?? randomPalette());
    publish(colors);
    // Deferred until the framework's router has hooked into the history API; a write
    // before that would drop the router's own state from this history entry.
    setTimeout(() => {
      if (snapshot?.colors === colors) writeHistory("replaceState", colors);
    }, 0);
  }
  window.addEventListener("popstate", onPopState);
}

export function subscribeToPalette(listener: () => void): () => void {
  initialise();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPaletteSnapshot(): PaletteSnapshot | null {
  return snapshot;
}

function current(): PaletteColor[] {
  return snapshot?.colors ?? [];
}

function update(id: string, change: Partial<PaletteColor>, mode: HistoryMode): void {
  commit(
    current().map((color) => (color.id === id ? { ...color, ...change } : color)),
    mode,
  );
}

export const paletteActions = {
  /** Live color change, e.g. while dragging the picker. */
  setHex(id: string, hex: string): void {
    update(id, { hex }, { burst: `hex:${id}` });
  },

  setName(id: string, name: string): void {
    update(id, { name: sanitizeName(name) }, "push");
  },

  toggleLock(id: string): void {
    const color = current().find((candidate) => candidate.id === id);
    if (color) update(id, { locked: !color.locked }, "replace");
  },

  /** Inserts a color after the given one. Without a hex it blends the neighbours. Returns false when the palette is full. */
  insertAfter(id: string, hex?: string): boolean {
    const colors = current();
    const position = colors.findIndex((color) => color.id === id);
    if (position === -1 || colors.length >= MAX_COLORS) return false;
    const next = colors[position + 1];
    const fallback = next
      ? midpoint(colors[position].hex, next.hex)
      : generateColors([...colors.map((color) => ({ hex: color.hex, locked: true })), { hex: "#808080", locked: false }]).at(-1)!;
    const added: PaletteColor = { id: createId(), hex: hex ?? fallback, name: "", locked: false };
    commit([...colors.slice(0, position + 1), added, ...colors.slice(position + 1)], "push");
    return true;
  },

  remove(id: string): void {
    const colors = current();
    if (colors.length <= MIN_COLORS) return;
    commit(
      colors.filter((color) => color.id !== id),
      "push",
    );
  },

  move(fromId: string, toId: string): void {
    const colors = [...current()];
    const from = colors.findIndex((color) => color.id === fromId);
    const to = colors.findIndex((color) => color.id === toId);
    if (from === -1 || to === -1 || from === to) return;
    const [moved] = colors.splice(from, 1);
    colors.splice(to, 0, moved);
    commit(colors, "push");
  },

  /** Replaces one color, keeping its name and lock. Used by fixes and by picking a variation. */
  replaceHex(id: string, hex: string): void {
    update(id, { hex }, "push");
  },

  replaceAll(entries: PaletteEntry[]): void {
    if (entries.length < MIN_COLORS) return;
    commit(hydrate(entries.slice(0, MAX_COLORS)), "push");
  },

  generate(): void {
    const colors = current();
    const hexes = generateColors(colors);
    commit(
      // A generated color is a different color, so a custom name no longer describes it.
      colors.map((color, position) => (color.locked ? color : { ...color, hex: hexes[position], name: "" })),
      "push",
    );
  },

  undo(): void {
    if (!snapshot?.canUndo) return;
    endBurst();
    window.history.back();
  },

  redo(): void {
    if (!snapshot?.canRedo) return;
    window.history.forward();
  },
};
