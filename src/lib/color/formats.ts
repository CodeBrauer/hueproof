import { converter } from "culori";
import { displayHex } from "./hex";

export interface ColorFormat {
  id: string;
  label: string;
  /** Comma-separated values, the default copy format. */
  plain: string;
  /** CSS notation, when CSS has one for this color space. */
  css: string | null;
}

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toHwb = converter("hwb");
const toLab = converter("lab");
const toLch = converter("lch");
const toLuv = converter("luv");
const toXyz = converter("xyz65");
const toOklch = converter("oklch");

function round(value: number | undefined, digits = 0): number {
  const factor = 10 ** digits;
  // `+ 0` turns -0 into 0 so it never prints as "-0".
  return Math.round((value ?? 0) * factor) / factor + 0;
}

/** Simple CMYK without a print profile: fine as a starting point, not colour-accurate for print. */
function toCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  return [
    round(((1 - r - k) / (1 - k)) * 100),
    round(((1 - g - k) / (1 - k)) * 100),
    round(((1 - b - k) / (1 - k)) * 100),
    round(k * 100),
  ];
}

export function colorFormats(hex: string): ColorFormat[] {
  const rgb = toRgb(hex)!;
  const hsl = toHsl(hex)!;
  const hwb = toHwb(hex)!;
  const lab = toLab(hex)!;
  const lch = toLch(hex)!;
  const luv = toLuv(hex)!;
  const xyz = toXyz(hex)!;
  const oklch = toOklch(hex)!;

  const rgb255 = [round(rgb.r * 255), round(rgb.g * 255), round(rgb.b * 255)];
  const hslValues = [round(hsl.h), round(hsl.s * 100), round(hsl.l * 100)];
  const hwbValues = [round(hwb.h), round(hwb.w * 100), round(hwb.b * 100)];
  const labValues = [round(lab.l, 1), round(lab.a, 1), round(lab.b, 1)];
  const lchValues = [round(lch.l, 1), round(lch.c, 1), round(lch.h, 1)];
  const luvValues = [round(luv.l, 1), round(luv.u, 1), round(luv.v, 1)];
  const xyzValues = [round(xyz.x * 100, 2), round(xyz.y * 100, 2), round(xyz.z * 100, 2)];
  const oklchValues = [round(oklch.l, 3), round(oklch.c, 3), round(oklch.h, 1)];
  const cmyk = toCmyk(rgb.r, rgb.g, rgb.b);

  return [
    { id: "hex", label: "HEX", plain: displayHex(hex), css: hex },
    { id: "rgb", label: "RGB", plain: rgb255.join(", "), css: `rgb(${rgb255.join(" ")})` },
    {
      id: "hsl",
      label: "HSL",
      plain: hslValues.join(", "),
      css: `hsl(${hslValues[0]} ${hslValues[1]}% ${hslValues[2]}%)`,
    },
    {
      id: "hwb",
      label: "HWB",
      plain: hwbValues.join(", "),
      css: `hwb(${hwbValues[0]} ${hwbValues[1]}% ${hwbValues[2]}%)`,
    },
    { id: "cmyk", label: "CMYK", plain: cmyk.join(", "), css: null },
    { id: "lab", label: "LAB", plain: labValues.join(", "), css: `lab(${labValues.join(" ")})` },
    { id: "lch", label: "LCH", plain: lchValues.join(", "), css: `lch(${lchValues.join(" ")})` },
    { id: "luv", label: "LUV", plain: luvValues.join(", "), css: null },
    {
      id: "xyz",
      label: "XYZ",
      plain: xyzValues.join(", "),
      css: `color(xyz-d65 ${xyzValues.map((value) => round(value / 100, 4)).join(" ")})`,
    },
    { id: "oklch", label: "OKLCH", plain: oklchValues.join(", "), css: `oklch(${oklchValues.join(" ")})` },
  ];
}
