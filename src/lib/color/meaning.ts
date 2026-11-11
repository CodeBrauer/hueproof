import data from "../../data/color-meaning.json";
import type { ColorFamily } from "./family";

/** A single study, a review of many studies, or a convention set by a standards body. */
export type MeaningKind = "study" | "review" | "convention";

type Localized = { en: string; de: string };

export interface MeaningSource {
  authors: string;
  year: number;
  title: string;
  container: string;
  doi: string | null;
  url: string;
}

export interface MeaningClaim {
  claim: Localized;
  kind: MeaningKind;
  caveat: Localized | null;
  sources: MeaningSource[];
}

/** Sourced statements per basic color term. Every entry links to the publication it is based on. */
export const COLOR_MEANINGS = data.families as unknown as Record<ColorFamily, MeaningClaim[]>;
