import { describe, expect, it } from "vitest";
import { COLOR_MEANINGS } from "./color/meaning";
import { generateColors, midpoint } from "./color/generate";
import { normalizeHex } from "./color/hex";
import { suggestRoles } from "./color/roles";
import { DEFAULT_PALETTE } from "./color/types";
import { EXPORT_FORMATS, toSlug, uniqueSlugs } from "./export";
import { parseImportText } from "./import";
import { renderPaletteSvg } from "./palette-image";

const build = (id: string) => EXPORT_FORMATS.find((format) => format.id === id)!.build;

describe("import", () => {
  it("reads `name: #hex` lines, the format colors are usually pasted in", () => {
    const text = "gold: #D5AC85\nweiß: #F5E9D9\nemerald: #132C29\nrot: #751729\nmint: #7A8F6E";
    expect(parseImportText(text)).toEqual(DEFAULT_PALETTE);
  });

  it("reads CSS and SCSS variables and ignores lines without a color", () => {
    expect(parseImportText("--brand: #0af;\n$accent: #FF8800;\nsand = #e8d9c0\nnot a color")).toEqual([
      { hex: "#00aaff", name: "brand" },
      { hex: "#ff8800", name: "accent" },
      { hex: "#e8d9c0", name: "sand" },
    ]);
  });

  it("reads a Coolors-style link without `#` signs", () => {
    const colors = parseImportText("https://coolors.co/985f99-9684a1-aaacb0-b6c9bb-bfedc1");
    expect(colors.map((color) => color.hex)).toEqual(["#985f99", "#9684a1", "#aaacb0", "#b6c9bb", "#bfedc1"]);
  });

  it("reads its own share links including names, in the current and the older form", () => {
    const expected = [
      { hex: "#d5ac85", name: "gold" },
      { hex: "#132c29", name: "emerald" },
    ];
    expect(parseImportText("https://example.com/de/#d5ac85-132c29&n=gold,emerald")).toEqual(expected);
    expect(parseImportText("https://example.com/?c=d5ac85-132c29&n=gold,emerald")).toEqual(expected);
  });

  it.each([
    ["commas", "D5AC85, F5E9D9, 132C29"],
    ["spaces", "D5AC85 F5E9D9 132C29"],
    ["commas without spaces", "d5ac85,f5e9d9,132c29"],
    ["# signs and commas", "#D5AC85, #F5E9D9, #132C29"],
    ["# signs and spaces", "#D5AC85 #F5E9D9 #132C29"],
    ["line breaks", "D5AC85\nF5E9D9\n132C29"],
    ["semicolons and tabs", "d5ac85;\tf5e9d9;\t132c29"],
  ])("reads unnamed hex codes separated by %s", (_, text) => {
    expect(parseImportText(text)).toEqual([
      { hex: "#d5ac85", name: "" },
      { hex: "#f5e9d9", name: "" },
      { hex: "#132c29", name: "" },
    ]);
  });

  it("reads a name next to a hex code without #", () => {
    expect(parseImportText("gold d5ac85\nmint: 7a8f6e")).toEqual([
      { hex: "#d5ac85", name: "gold" },
      { hex: "#7a8f6e", name: "mint" },
    ]);
  });

  it("ignores the alpha part of eight-digit hex codes", () => {
    expect(parseImportText("#D5AC85FF, #132C2980")).toEqual([
      { hex: "#d5ac85", name: "" },
      { hex: "#132c29", name: "" },
    ]);
  });

  it("does not mistake longer hex strings or words for colors", () => {
    expect(parseImportText("commit 9f8e7d6c5b4a and id abcdef123456"), "longer than six digits").toEqual([]);
    expect(parseImportText("12345"), "five digits").toEqual([]);
  });

  it("reads links with numbered color and name parameters", () => {
    const link = "https://tester.example/?id0=1&color0=%23d5ac85&name0=gold&id1=2&color1=%23f5e9d9&name1=wei%C3%9F&mode=WCAG21";
    expect(parseImportText(link)).toEqual([
      { hex: "#d5ac85", name: "gold" },
      { hex: "#f5e9d9", name: "weiß" },
    ]);
  });

  it("leaves names empty when a line holds several colors", () => {
    expect(parseImportText("#111111, #222222 and #333")).toEqual([
      { hex: "#111111", name: "" },
      { hex: "#222222", name: "" },
      { hex: "#333333", name: "" },
    ]);
  });

  it("returns nothing for text without colors and caps long lists at ten", () => {
    expect(parseImportText("hello world")).toEqual([]);
    expect(parseImportText("")).toEqual([]);
    expect(parseImportText(Array.from({ length: 15 }, (_, index) => `#0000${index + 10}`).join("\n"))).toHaveLength(10);
  });
});

describe("export", () => {
  it("builds identifiers from names", () => {
    expect(toSlug("Weiß 2", 0)).toBe("weiss-2");
    expect(toSlug("Nymph’s Delight", 0)).toBe("nymphs-delight");
    expect(toSlug("Crème brûlée", 0)).toBe("creme-brulee");
    expect(toSlug("100 Mph", 0), "identifiers must not start with a digit").toBe("color-100-mph");
    expect(toSlug("***", 2), "nothing usable left").toBe("color-3");
  });

  it("keeps identifiers unique", () => {
    const colors = [
      { name: "Blue", hex: "#0000ff" },
      { name: "blue", hex: "#0000ee" },
      { name: "BLUE", hex: "#0000dd" },
    ];
    expect(uniqueSlugs(colors)).toEqual(["blue", "blue-2", "blue-3"]);
  });

  it("writes CSS variables, SCSS and a Tailwind theme", () => {
    const colors = [...DEFAULT_PALETTE.slice(0, 2)];
    expect(build("css")(colors)).toBe(":root {\n  --gold: #d5ac85;\n  --weiss: #f5e9d9;\n}");
    expect(build("scss")(colors)).toBe("$gold: #d5ac85;\n$weiss: #f5e9d9;");
    expect(build("tailwind")(colors)).toBe("@theme {\n  --color-gold: #d5ac85;\n  --color-weiss: #f5e9d9;\n}");
  });

  it("writes valid JSON and design tokens", () => {
    const json = JSON.parse(build("json")(DEFAULT_PALETTE));
    expect(json[4]).toMatchObject({ name: "mint", slug: "mint", hex: "#7a8f6e", rgb: [122, 143, 110] });
    const tokens = JSON.parse(build("tokens")(DEFAULT_PALETTE));
    expect(tokens.color.gold.$type).toBe("color");
    expect(tokens.color.gold.$value.hex).toBe("#d5ac85");
    expect(tokens.color.gold.$value.components).toHaveLength(3);
  });

  it("escapes names in the SVG so markup in a name cannot break the image", () => {
    const svg = renderPaletteSvg([{ hex: "#112233", name: '<script>"&' }]);
    expect(svg).toContain("&lt;script&gt;&quot;&amp;");
    expect(svg).not.toContain("<script>");
  });
});

describe("generator", () => {
  // A fixed sequence instead of Math.random keeps the test deterministic.
  const sequence = () => {
    let seed = 7;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  };

  it("keeps locked colors and replaces the others with valid hex colors", () => {
    const current = DEFAULT_PALETTE.map((color, index) => ({ hex: color.hex, locked: index < 2 }));
    const result = generateColors(current, sequence());
    expect(result.slice(0, 2)).toEqual([current[0].hex, current[1].hex]);
    for (const hex of result) expect(normalizeHex(hex), hex).toBe(hex);
    expect(result.slice(2)).not.toEqual(current.slice(2).map((color) => color.hex));
  });

  it("blends two neighbours into a color between them", () => {
    // The perceptual middle between black and white (OKLCH lightness 0.5) is darker than #808080.
    expect(midpoint("#000000", "#ffffff")).toBe("#636363");
    expect(midpoint("#ff0000", "#ff0000")).toBe("#ff0000");
  });
});

describe("roles", () => {
  it("suggests background, surface, text, primary and accent for the reference palette", () => {
    const hexes = DEFAULT_PALETTE.map((color) => color.hex);
    const roles = suggestRoles(hexes);
    const named = Object.fromEntries(Object.entries(roles).map(([role, index]) => [role, DEFAULT_PALETTE[index].name]));
    expect(named).toEqual({ background: "weiß", surface: "gold", text: "emerald", primary: "rot", accent: "mint" });
  });

  it("works with the smallest palette", () => {
    expect(suggestRoles(["#ffffff", "#000000"])).toEqual({ background: 0, surface: 0, text: 1, primary: 1, accent: 1 });
  });
});

describe("meaning statements", () => {
  const claims = Object.entries(COLOR_MEANINGS).flatMap(([family, entries]) =>
    entries.map((entry) => ({ family, ...entry })),
  );

  it("covers all eleven color families", () => {
    expect(Object.keys(COLOR_MEANINGS)).toHaveLength(11);
    for (const [family, entries] of Object.entries(COLOR_MEANINGS)) {
      expect(entries.length, `${family} has no statement`).toBeGreaterThan(0);
    }
  });

  it("has every statement and caveat in both languages", () => {
    for (const { family, claim, caveat } of claims) {
      expect(claim.en.trim(), `${family}: English statement`).not.toBe("");
      expect(claim.de.trim(), `${family}: German statement for "${claim.en}"`).not.toBe("");
      if (caveat) {
        expect(caveat.en.trim(), `${family}: English caveat`).not.toBe("");
        expect(caveat.de.trim(), `${family}: German caveat for "${claim.en}"`).not.toBe("");
      }
    }
  });

  it("backs every statement with at least one linked source", () => {
    for (const { family, claim, kind, sources } of claims) {
      expect(["study", "review", "convention"], `${family}: kind of "${claim.en}"`).toContain(kind);
      expect(sources.length, `${family}: "${claim.en}" has no source`).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.url, `${family}: source link of "${claim.en}"`).toMatch(/^https:\/\//);
        if (source.doi) expect(source.url, "DOI sources link to doi.org").toBe(`https://doi.org/${source.doi}`);
      }
    }
  });
});
