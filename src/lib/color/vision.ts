import {
  converter,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
  wcagLuminance,
  type Rgb,
} from "culori";

/** Severity used for the anomalous (partial) deficiencies on the 0–1 scale of Machado et al. (2009). */
const ANOMALY_SEVERITY = 0.5;
const CACHE_LIMIT = 5000;

export type VisionId =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "protanomaly"
  | "deuteranomaly"
  | "tritanomaly"
  | "achromatopsia";

/** Which kind of color difference is affected; frequencies are known per group. */
export type VisionGroup = "typical" | "redGreen" | "blueYellow" | "monochromacy";

export interface VisionType {
  id: VisionId;
  group: VisionGroup;
}

export const VISION_TYPES: readonly VisionType[] = [
  { id: "normal", group: "typical" },
  { id: "protanopia", group: "redGreen" },
  { id: "protanomaly", group: "redGreen" },
  { id: "deuteranopia", group: "redGreen" },
  { id: "deuteranomaly", group: "redGreen" },
  { id: "tritanopia", group: "blueYellow" },
  { id: "tritanomaly", group: "blueYellow" },
  { id: "achromatopsia", group: "monochromacy" },
];

export const VISION_GROUPS: readonly VisionGroup[] = ["typical", "redGreen", "blueYellow", "monochromacy"];

export const DEFICIENCY_TYPES = VISION_TYPES.filter((type) => type.id !== "normal");

const toRgb = converter("rgb");

const filters: Record<Exclude<VisionId, "normal" | "achromatopsia">, (color: Rgb) => Rgb> = {
  protanopia: filterDeficiencyProt(1),
  deuteranopia: filterDeficiencyDeuter(1),
  tritanopia: filterDeficiencyTrit(1),
  protanomaly: filterDeficiencyProt(ANOMALY_SEVERITY),
  deuteranomaly: filterDeficiencyDeuter(ANOMALY_SEVERITY),
  tritanomaly: filterDeficiencyTrit(ANOMALY_SEVERITY),
};

const cache = new Map<string, string>();

function compute(hex: string, vision: VisionId): string {
  if (vision === "normal") return hex;
  if (vision === "achromatopsia") {
    // Only luminance is left: a gray with the same relative luminance.
    const luminance = wcagLuminance(hex);
    return formatHex({ mode: "lrgb", r: luminance, g: luminance, b: luminance });
  }
  return formatHex(filters[vision](toRgb(hex)!));
}

/** How a color appears under the given vision type, as `#rrggbb`. */
export function simulate(hex: string, vision: VisionId): string {
  const key = `${vision}:${hex}`;
  const cached = cache.get(key);
  if (cached) return cached;
  if (cache.size >= CACHE_LIMIT) cache.clear();
  const result = compute(hex, vision);
  cache.set(key, result);
  return result;
}
