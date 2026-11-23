import { beforeAll, describe, expect, it } from "vitest";
import { apcaLc, contrastTier, formatContrast, nearMissTarget, pairContrast, readableOn, wcagRatio } from "./contrast";
import { analyzePairs, colorDifference, largestSafeSet } from "./difference";
import { colorFamily } from "./family";
import { ensureContrast, fixConfusablePair, fixContrast } from "./fix";
import { CMYK_SMALL_INK_THRESHOLD, colorFormats, omitSmallInk } from "./formats";
import { isFullHex, normalizeHex, sanitizeName } from "./hex";
import { hexWord } from "./hexword";
import {
  colorAt,
  colorLocations,
  dominantColors,
  loadImageAnalysis,
  MAX_SAMPLED_PIXELS,
  MIN_VISIBLE_ALPHA,
  type Pixels,
} from "./image";
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

describe("isFullHex", () => {
  it.each(["#d5ac85", "D5AC85"])("accepts %s", (input) => {
    expect(isFullHex(input)).toBe(true);
  });

  // The shorthand is also the first half of a six-digit code that is still being typed.
  it.each(["#abc", "abc", "#d5ac8", "", "#gggggg", "#d5ac85ff"])("rejects %j", (input) => {
    expect(isFullHex(input)).toBe(false);
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

  it("keeps a color that reaches the target and fixes one that does not", () => {
    expect(ensureContrast("wcag", "#000000", "#ffffff", 4.5)).toBe("#000000");
    const pale = ensureContrast("wcag", "#f5e9d9", "#ffffff", 4.5);
    expect(wcagRatio(pale, "#ffffff"), "pale beige on white").toBeGreaterThanOrEqual(4.5);
    const dark = ensureContrast("wcag", "#132c29", "#0e0e0e", 4.5);
    expect(wcagRatio(dark, "#0e0e0e"), "dark green on near black").toBeGreaterThanOrEqual(4.5);
  });

  it("falls back to black or white when no lightness can reach the target", () => {
    expect(ensureContrast("wcag", "#808080", "#777777", 21)).toBe(readableOn("#777777"));
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

  describe("small CMYK ink", () => {
    const T = CMYK_SMALL_INK_THRESHOLD;

    it("sets channels below the threshold to 0", () => {
      expect(omitSmallInk([T - 1, 40, 0, 2])).toEqual([0, 40, 0, 0]);
    });

    it("keeps channels at and above the threshold", () => {
      expect(omitSmallInk([T, T + 1, 100, T])).toEqual([T, T + 1, 100, T]);
    });

    it("leaves all-zero and pure black alone", () => {
      expect(omitSmallInk([0, 0, 0, 0])).toEqual([0, 0, 0, 0]);
      expect(omitSmallInk([0, 0, 0, 100])).toEqual([0, 0, 0, 100]);
    });

    it("does not mutate its input", () => {
      const input: [number, number, number, number] = [1, 2, 30, 4];
      omitSmallInk(input);
      expect(input).toEqual([1, 2, 30, 4]);
    });

    it("applies to the CMYK format only when asked", () => {
      const cmyk = (hex: string, omit: boolean) =>
        colorFormats(hex, { omitSmallInk: omit }).find((format) => format.id === "cmyk")!.plain;
      expect(cmyk("#f2ffe6", false)).toBe("5, 0, 10, 0");
      expect(cmyk("#f7ffee", false)).toBe("3, 0, 7, 0");
      expect(cmyk("#f7ffee", true)).toBe("0, 0, 7, 0");
      expect(cmyk("#f2ffe6", true)).toBe("5, 0, 10, 0");
      expect(cmyk(mint, true)).toBe("15, 0, 23, 44");
    });
  });
});

describe("colors from an image", () => {
  type Rgba = [number, number, number, number?];
  const OPAQUE = 255;

  beforeAll(() => loadImageAnalysis());

  function image(width: number, height: number, fill: (x: number, y: number) => Rgba): Pixels {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b, a = OPAQUE] = fill(x, y);
        data.set([r, g, b, a], (y * width + x) * 4);
      }
    }
    return { data, width, height };
  }

  // Half white, 30 % navy, 20 % orange, in vertical bands.
  const bands = image(10, 4, (x) => (x < 5 ? [255, 255, 255] : x < 8 ? [20, 30, 90] : [240, 120, 20]));

  it("returns the exact colors of a flat image, the largest area first and white included", () => {
    expect(dominantColors(bands, 5)).toEqual(["#ffffff", "#141e5a", "#f07814"]);
  });

  it("samples large images without losing their colors or order", () => {
    const side = Math.ceil(Math.sqrt(MAX_SAMPLED_PIXELS * 3));
    const large = image(side, side, (x) => (x < side * 0.6 ? [20, 30, 90] : [240, 120, 20]));
    expect(dominantColors(large, 5)).toEqual(["#141e5a", "#f07814"]);
  });

  it("finds the main colors of a noisy image", () => {
    const noise = (x: number, y: number) => ((x * 7 + y * 13) % 21) - 10;
    const sky: Rgba = [80, 140, 210];
    const grass: Rgba = [60, 120, 50];
    const photo = image(64, 64, (x, y) => {
      const [r, g, b] = y < 40 ? sky : grass;
      const n = noise(x, y);
      return [r + n, g + n, b + n];
    });
    const found = dominantColors(photo, 2);
    expect(found).toHaveLength(2);
    expect(colorDifference(found[0], "#508cd2"), "the sky covers most of the image").toBeLessThan(3);
    expect(colorDifference(found[1], "#3c7832"), "then the grass").toBeLessThan(3);
  });

  it("returns at most the requested number of colors, within the palette size", () => {
    const gradient = image(100, 1, (x) => [x * 2, 255 - x * 2, 128]);
    expect(dominantColors(gradient, 4)).toHaveLength(4);
    expect(dominantColors(gradient, 50), "capped at the largest palette").toHaveLength(10);
    expect(dominantColors(gradient, 1), "raised to the smallest palette").toHaveLength(2);
  });

  it("finds the colors of a large image whose visible pixels fall between the sampled ones", () => {
    const side = Math.ceil(Math.sqrt(MAX_SAMPLED_PIXELS * 4));
    const sparse = image(side, side, (x) => (x % 4 === 1 ? [255, 0, 0] : [0, 0, 0, 0]));
    expect(dominantColors(sparse, 5), "not the black of the transparent pixels").toEqual(["#ff0000"]);
  });

  it("leaves transparent pixels out", () => {
    const logo = image(10, 1, (x) => (x < 7 ? [0, 0, 0, 0] : [200, 0, 0]));
    expect(dominantColors(logo, 5)).toEqual(["#c80000"]);
    expect(dominantColors(image(4, 4, () => [0, 0, 0, 0]), 5), "a fully transparent image").toEqual([]);
  });

  it("reads the pixel under a point", () => {
    expect(colorAt(bands, { x: 0, y: 0 })).toBe("#ffffff");
    expect(colorAt(bands, { x: 0.6, y: 0.5 })).toBe("#141e5a");
    expect(colorAt(bands, { x: 1, y: 1 }), "the far edge belongs to the last pixel").toBe("#f07814");
  });

  it("keeps points outside the image on its edge", () => {
    expect(colorAt(bands, { x: -3, y: 0.5 })).toBe("#ffffff");
    expect(colorAt(bands, { x: 7, y: 2 })).toBe("#f07814");
  });

  it("picks nothing where the image is transparent", () => {
    const fading = image(2, 1, (x) => [10, 20, 30, x === 0 ? MIN_VISIBLE_ALPHA - 1 : MIN_VISIBLE_ALPHA]);
    expect(colorAt(fading, { x: 0, y: 0 })).toBeNull();
    expect(colorAt(fading, { x: 1, y: 0 })).toBe("#0a141e");
  });

  it("places each marker inside the area of its color, in the order asked for", () => {
    const [orange, white, navy] = colorLocations(bands, ["#f07814", "#ffffff", "#141e5a"]);
    expect(white!.x, "white covers the left half").toBeLessThan(0.5);
    expect(navy!.x, "navy starts at the middle").toBeGreaterThanOrEqual(0.5);
    expect(navy!.x, "navy ends at 80 %").toBeLessThan(0.8);
    expect(orange!.x, "orange covers the last 20 %").toBeGreaterThanOrEqual(0.8);
  });

  it("puts the marker in the middle of a small area, not at its edge", () => {
    const stamp = image(64, 64, (x, y) => (x >= 40 && x < 52 && y >= 8 && y < 20 ? [200, 0, 0] : [255, 255, 255]));
    const [red] = colorLocations(stamp, ["#c80000"]);
    expect(Math.abs(red!.x * 64 - 46), "horizontally").toBeLessThanOrEqual(2);
    expect(Math.abs(red!.y * 64 - 14), "vertically").toBeLessThanOrEqual(2);
  });

  it("finds a color on a gradient where it occurs", () => {
    const gradient = image(64, 8, (x) => [x * 4, x * 4, x * 4]);
    const [gray] = colorLocations(gradient, ["#808080"]);
    expect(Math.abs(gray!.x - 0.5)).toBeLessThan(0.05);
  });

  it("has no place for a color in a fully transparent image", () => {
    expect(colorLocations(image(4, 4, () => [0, 0, 0, 0]), ["#000000"])).toEqual([null]);
  });

  it("picks nothing from an empty image", () => {
    expect(colorAt({ data: new Uint8ClampedArray(0), width: 0, height: 0 }, { x: 0.5, y: 0.5 })).toBeNull();
    expect(dominantColors({ data: new Uint8ClampedArray(0), width: 0, height: 0 }, 5)).toEqual([]);
  });
});

describe("hexWord", () => {
  it("finds the word a hex code spells", () => {
    expect(hexWord("#c0ffee")).toBe("coffee");
    expect(hexWord("#bada55")).toBe("badass");
    expect(hexWord("#decade")).toBe("decade");
  });

  it("ignores case, the leading # and surrounding whitespace", () => {
    expect(hexWord("#C0FFEE")).toBe("coffee");
    expect(hexWord("c0ffee")).toBe("coffee");
    expect(hexWord("  #BaDa55 ")).toBe("badass");
  });

  it("returns null for codes that spell nothing", () => {
    expect(hexWord("#123456")).toBeNull();
    expect(hexWord(gold)).toBeNull();
  });

  it("does not expand three-digit shorthands", () => {
    expect(hexWord("#bad")).toBeNull();
    expect(hexWord("#fee")).toBeNull();
  });

  it("returns null for malformed input", () => {
    for (const input of ["", "#", "#c0ffe", "#c0ffee0", "#c0ffeg", "coffee", "constructor", "__proto__"]) {
      expect(hexWord(input), input).toBeNull();
    }
  });
});
