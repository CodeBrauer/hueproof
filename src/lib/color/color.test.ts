import { describe, expect, it } from "vitest";
import { apcaLc, contrastTier, formatContrast, nearMissTarget, pairContrast, readableOn, wcagRatio } from "./contrast";
import { analyzePairs, largestSafeSet } from "./difference";
import { colorFamily } from "./family";
import { fixConfusablePair, fixContrast } from "./fix";
import { colorFormats } from "./formats";
import { normalizeHex, sanitizeName } from "./hex";
import { classifyTemperature } from "./temperature";
import { DEFAULT_PALETTE } from "./types";
import { parsePalette, serializePalette } from "./url";
import { harmonies, shades, tints } from "./variations";
import { simulate } from "./vision";

const [gold, white, emerald, red, mint] = DEFAULT_PALETTE.map((color) => color.hex);
const hexes = [gold, white, emerald, red, mint];

describe("normalizeHex", () => {
  it.each([
    ["#D5AC85", "#d5ac85"],
    ["d5ac85", "#d5ac85"],
    [" #abc ", "#aabbcc"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeHex(input)).toBe(expected);
  });

  it.each(["", "#12", "#12345", "#1234567", "#gggggg", "rgb(1,2,3)", "<script>"])("rejects %j", (input) => {
    expect(normalizeHex(input)).toBeNull();
  });
});

describe("palette URL", () => {
  it("round-trips colors and names, including non-ASCII names", () => {
    const fragment = serializePalette(DEFAULT_PALETTE);
    expect(fragment).toBe("d5ac85-f5e9d9-132c29-751729-7a8f6e&n=gold,wei%C3%9F,emerald,rot,mint");
    expect(parsePalette(`#${fragment}`)).toEqual(DEFAULT_PALETTE);
    expect(parsePalette(fragment), "without the leading #").toEqual(DEFAULT_PALETTE);
  });

  it("writes only the hex codes when no color is named", () => {
    expect(serializePalette([{ hex: "#112233", name: "" }, { hex: "#445566", name: "" }])).toBe("112233-445566");
  });

  it("still reads links from before the palette moved into the fragment", () => {
    expect(parsePalette("?c=d5ac85-132c29&n=gold,emerald")).toEqual([
      { hex: "#d5ac85", name: "gold" },
      { hex: "#132c29", name: "emerald" },
    ]);
  });

  it("drops invalid colors but keeps the names of the valid ones aligned", () => {
    expect(parsePalette("#d5ac85-nope-132c29&n=gold,broken,emerald")).toEqual([
      { hex: "#d5ac85", name: "gold" },
      { hex: "#132c29", name: "emerald" },
    ]);
  });

  it("returns null when fewer than two valid colors remain", () => {
    expect(parsePalette("#d5ac85-zzzzzz"), "one valid color is not a palette").toBeNull();
    expect(parsePalette(""), "empty fragment").toBeNull();
    expect(parsePalette("#"), "bare #").toBeNull();
    expect(parsePalette("#some-anchor"), "an ordinary page anchor").toBeNull();
  });

  it("caps the palette at ten colors", () => {
    const fragment = `#${Array.from({ length: 14 }, () => "123456").join("-")}`;
    expect(parsePalette(fragment)).toHaveLength(10);
  });

  it("strips commas from names so they cannot shift the name list", () => {
    expect(sanitizeName("  dark, moody  green ")).toBe("dark moody green");
  });
});

describe("contrast", () => {
  it("matches the WCAG ratios of the reference palette", () => {
    expect(wcagRatio(emerald, white)).toBeCloseTo(12.35, 2);
    expect(wcagRatio(emerald, mint)).toBeCloseTo(4.21, 2);
    expect(wcagRatio(emerald, red)).toBeCloseTo(1.35, 2);
    expect(wcagRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("assigns tiers at the exact thresholds", () => {
    expect(contrastTier("wcag", 2.99)).toBe(0);
    expect(contrastTier("wcag", 3)).toBe(1);
    expect(contrastTier("wcag", 4.5)).toBe(2);
    expect(contrastTier("wcag", 7)).toBe(3);
    expect(contrastTier("apca", 74.9)).toBe(1);
  });

  it("never rounds a failing value up to a passing one", () => {
    expect(formatContrast("wcag", 4.499)).toBe("4.49:1");
  });

  it("treats APCA as polarity-sensitive and uses the weaker direction for a pair", () => {
    const darkOnLight = apcaLc(emerald, white);
    const lightOnDark = apcaLc(white, emerald);
    expect(darkOnLight).not.toBeCloseTo(lightOnDark, 1);
    expect(pairContrast("apca", emerald, white)).toBe(Math.min(darkOnLight, lightOnDark));
  });

  it("flags values just below a threshold as near misses", () => {
    expect(nearMissTarget("wcag", 4.21), "emerald on mint").toBe(4.5);
    expect(nearMissTarget("wcag", 1.35), "far from any threshold").toBeNull();
    expect(nearMissTarget("wcag", 9), "already at the top tier").toBeNull();
  });

  it("picks black or white text by contrast", () => {
    expect(readableOn(white)).toBe("#000000");
    expect(readableOn(emerald)).toBe("#ffffff");
  });
});

describe("auto-fix", () => {
  it("reaches the target with a small lightness change", () => {
    const fix = fixContrast("wcag", emerald, mint, 4.5, "text");
    expect(fix, "emerald on mint is fixable").not.toBeNull();
    expect(wcagRatio(fix!.hex, mint)).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(fix!.deltaL)).toBeLessThan(0.05);
  });

  it("returns null when no lightness can reach the target", () => {
    expect(fixContrast("wcag", "#808080", "#777777", 21, "text")).toBeNull();
  });

  it("separates a confusable pair without creating a new conflict", () => {
    const fix = fixConfusablePair(hexes, 3, 2);
    expect(fix, "red vs emerald is fixable").not.toBeNull();
    const after = hexes.map((hex, index) => (index === 3 ? fix!.hex : hex));
    expect(analyzePairs(after).filter((pair) => pair.category === "confusable")).toHaveLength(0);
  });
});

describe("color vision", () => {
  it("leaves colors untouched for normal vision and removes hue for achromatopsia", () => {
    expect(simulate(red, "normal")).toBe(red);
    const gray = simulate(red, "achromatopsia");
    expect(gray.slice(1, 3)).toBe(gray.slice(3, 5));
    expect(gray.slice(3, 5)).toBe(gray.slice(5, 7));
  });

  it("finds emerald and red as the only confusable pair of the reference palette", () => {
    const confusable = analyzePairs(hexes).filter((pair) => pair.category === "confusable");
    expect(confusable.map((pair) => [pair.a, pair.b])).toEqual([[2, 3]]);
  });

  it("returns the largest group without a confusable pair", () => {
    const pairs = analyzePairs(hexes);
    expect(largestSafeSet(hexes.length, pairs)).toHaveLength(4);
  });
});

describe("classification", () => {
  it("maps the reference palette to basic color families", () => {
    expect(hexes.map(colorFamily)).toEqual(["orange", "white", "green", "red", "green"]);
  });

  it.each([
    ["#ff0000", "red"],
    ["#ffff00", "yellow"],
    ["#0000ff", "blue"],
    ["#8b4513", "brown"],
    ["#ff69b4", "pink"],
    ["#800080", "purple"],
    ["#000000", "black"],
    ["#808080", "gray"],
  ])("classifies %s as %s", (hex, family) => {
    expect(colorFamily(hex)).toBe(family);
  });

  it("reads warm, cool and neutral colors", () => {
    expect(hexes.map(classifyTemperature)).toEqual(["warm", "warm", "cool", "warm", "neutral"]);
    expect(classifyTemperature("#808080")).toBe("neutral");
  });
});

describe("variations and formats", () => {
  it("moves shades towards black and tints towards white", () => {
    expect(wcagRatio(shades(mint).at(-1)!, "#000000")).toBeLessThan(wcagRatio(mint, "#000000"));
    expect(wcagRatio(tints(mint).at(-1)!, "#ffffff")).toBeLessThan(wcagRatio(mint, "#ffffff"));
  });

  it("keeps the base color inside every harmony", () => {
    for (const harmony of harmonies(mint)) expect(harmony.colors, harmony.id).toContain(mint);
  });

  it("converts to the common notations", () => {
    const formats = Object.fromEntries(colorFormats(mint).map((format) => [format.id, format]));
    expect(formats.rgb.plain).toBe("122, 143, 110");
    expect(formats.hsl.plain).toBe("98, 13, 50");
    expect(formats.cmyk.plain).toBe("15, 0, 23, 44");
    expect(formats.hex.plain).toBe("7A8F6E");
    expect(formats.xyz.plain).toBe("20.66, 24.91, 18.47");
  });
});
