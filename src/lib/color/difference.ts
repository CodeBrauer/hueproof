import { differenceCiede2000 } from "culori";
import { simulate, VISION_TYPES, type VisionId } from "./vision";

/**
 * Heuristic thresholds on CIEDE2000 for telling two palette colors apart
 * (legend entries, chart series). They are a rule of thumb, not a standard.
 */
export const CONFUSABLE_BELOW = 10;
export const MARGINAL_BELOW = 20;

export type PairCategory = "confusable" | "marginal" | "distinct";

export interface PairDifference {
  a: number;
  b: number;
  /** Smallest difference across all vision types, including normal vision. */
  worst: number;
  worstVision: VisionId;
  category: PairCategory;
}

const ciede2000 = differenceCiede2000();

export function colorDifference(a: string, b: string): number {
  return ciede2000(a, b);
}

export function categorize(difference: number): PairCategory {
  if (difference < CONFUSABLE_BELOW) return "confusable";
  if (difference < MARGINAL_BELOW) return "marginal";
  return "distinct";
}

/** Smallest difference between two colors across all vision types. */
export function worstCaseDifference(a: string, b: string): { worst: number; worstVision: VisionId } {
  let worst = Infinity;
  let worstVision: VisionId = "normal";
  for (const { id } of VISION_TYPES) {
    const difference = colorDifference(simulate(a, id), simulate(b, id));
    if (difference < worst) {
      worst = difference;
      worstVision = id;
    }
  }
  return { worst, worstVision };
}

export function analyzePairs(hexes: string[]): PairDifference[] {
  const pairs: PairDifference[] = [];
  for (let a = 0; a < hexes.length; a++) {
    for (let b = a + 1; b < hexes.length; b++) {
      const { worst, worstVision } = worstCaseDifference(hexes[a], hexes[b]);
      pairs.push({ a, b, worst, worstVision, category: categorize(worst) });
    }
  }
  return pairs;
}

/** Indices of the largest group of colors without a confusable pair. Palettes are small, so every subset is checked. */
export function largestSafeSet(count: number, pairs: PairDifference[]): number[] {
  const conflicts = pairs.filter((pair) => pair.category === "confusable");
  let best: number[] = [];
  for (let mask = 1; mask < 1 << count; mask++) {
    const members: number[] = [];
    for (let index = 0; index < count; index++) {
      if (mask & (1 << index)) members.push(index);
    }
    if (members.length <= best.length) continue;
    const isSafe = conflicts.every((pair) => !(mask & (1 << pair.a) && mask & (1 << pair.b)));
    if (isSafe) best = members;
  }
  return best;
}
