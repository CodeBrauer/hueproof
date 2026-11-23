# Color logic

All of it lives in `src/lib/color/` as pure functions. Colors are lowercase `#rrggbb` strings everywhere;
`normalizeHex` in `hex.ts` converts input at the boundaries. Conversions and color math come from
[`culori`](https://culorijs.org). Tests are in `src/lib/color/color.test.ts`.

| Module | What it answers | Method |
| --- | --- | --- |
| `contrast.ts` | Is this text readable on that background? | WCAG 2 ratio, or APCA lightness contrast through `apca-w3` |
| `vision.ts` | How does a color look with a color vision deficiency? | Machado, Oliveira & Fernandes (2009) |
| `difference.ts` | Can two colors be told apart? | CIEDE2000, worst case over all vision types |
| `fix.ts` | What is the smallest change that solves a problem? | Search over OKLCH lightness |
| `temperature.ts` | Warm, neutral or cool? | Colour-heat model of Ou et al. (2004) |
| `roles.ts` | Which color could be background, text, primary? | Sorted by OKLCH lightness and chroma |
| `generate.ts` | New colors for the unlocked slots | Hue scheme around a locked color, in OKLCH |
| `naming.ts` | A name for a color | Nearest entry of `color-name-list` in OKLab, loaded on demand |
| `hexword.ts` | Does the hex code spell a word (`#C0FFEE`)? | Exact lookup in `src/data/hex-words.ts`, a static list of 556 six-letter words (ISC, from [melted/hexwords](https://github.com/melted/hexwords)) |
| `image.ts` | Which colors dominate an image, where do they sit, and which color is under a point? | Modified median cut (MMCQ) in OKLCH through [`colorthief`](https://github.com/lokesh/color-thief), on a scaled-down copy of the image; locations by distance in OKLab on a grid |
| `family.ts` | Which basic color term (red, brown, …)? | Boundaries in OKLCH; selects the notes in the Meaning tab |
| `formats.ts`, `variations.ts` | Conversions, shades, tints, tones, harmonies | `culori` |

## The numbers

| Value | Where | Standard or heuristic |
| --- | --- | --- |
| WCAG levels 3, 4.5 and 7 | `CONTRAST_THRESHOLDS` | Standard (WCAG 2.2, SC 1.4.3 and 1.4.6) |
| APCA levels Lc 60, 75 and 90 | `CONTRAST_THRESHOLDS` | APCA Bronze "simple mode" |
| Near miss: at least 85 % of the next level | `NEAR_MISS_RATIO` | Heuristic |
| ΔE below 10 is "hard to tell apart", below 20 "close" | `CONFUSABLE_BELOW`, `MARGINAL_BELOW` | Heuristic |
| Severity 0.5 for the "-anomaly" types | `ANOMALY_SEVERITY` | Choice within the Machado model (0 to 1) |
| Neutral band of ±0.12 warmth | `NEUTRAL_BAND` | Heuristic |
| CMYK channels below 5 % can be left out | `CMYK_SMALL_INK_THRESHOLD` | Print guidance, not a standard (see below) |
| Images are read at most 512 px on the longer side | `MAX_IMAGE_SIDE` in `src/lib/image.ts` | Heuristic |
| At most 65,536 pixels of an image are sampled | `MAX_SAMPLED_PIXELS` | Heuristic |
| Pixels with an alpha below 125 count as transparent | `MIN_VISIBLE_ALPHA` | Heuristic, colorthief's default |
| Markers search a grid of about 32 × 32 cells | `LOCATION_GRID` | Heuristic |
| Cells within 0.02 (OKLab) of the best match count as equally good | `LOCATION_TOLERANCE` | Heuristic, about one just noticeable difference |

## Details worth knowing

- **Contrast values are truncated, not rounded,** so a failing 4.499 never reads as a passing 4.5.
- **APCA depends on polarity.** `apcaLc(text, background)` is not symmetric; `pairContrast` takes the weaker
  direction. WCAG ratios are symmetric, so the "Close calls" list shows each WCAG pair once.
- **Achromatopsia** is not part of the Machado model. It is shown as the gray with the same relative
  luminance.
- **A fix changes lightness only.** `findLightnessFix` walks outward from the current OKLCH lightness in
  steps of 0.004, in both directions, and returns the first candidate that passes. Hue and chroma stay;
  chroma is clamped to sRGB. For a confusable pair the fix must not make any other pair worse than it was.
  `ensureContrast` applies such a fix only when a color misses the target; the toolbar logo uses it for each
  letter against the page background of both themes.
- **CMYK has no print profile.** `formats.ts` converts from RGB with the plain formula, so the value is an
  approximation. The optional "omit < 5 %" setting (`omitSmallInk`) sets every channel below
  `CMYK_SMALL_INK_THRESHOLD` to 0 and keeps the rest; the copied value follows it. The choice is remembered in
  `localStorage` (`readOmitSmallInk`, default off). The threshold is print guidance: very small dots print
  unreliably, and the smallest dot that holds depends on process, screen ruling and plate. Kodak gives about
  4 % to 10 % for flexographic LAMS plates and says dots below the minimum "form unreliably and unstably"
  ([Kodak ColorFlow, LAMS plates](https://workflowhelp.kodak.com/x/x4URE)); 5 % is a conservative common choice,
  so check your printer's own minimum.
- **Hex words** read the letters o, l, z, s and g as 0, 1, 2, 5 and 9. Only six-digit codes count; a shorthand like
  `#bad` expands to `#bbaadd` and never spells anything. The list is generated once with
  `scripts/generate-hex-words.mjs`; its header names the source, license and filter.
- **The largest safe set** checks every subset. That is fine for at most 10 colors (1,024 subsets).
- **Warmth** is `0.02 · C^1.07 · cos(h − 50°)` in CIELAB LCh. The constant offset of the published model
  is left out, so near-neutral colors read as neutral.
- **Roles are a first guess:** lightest color as background, darkest as text, with five or more colors the
  second lightest as surface, then the most colorful of the rest as primary and accent.
- **Colors from an image** come from a copy at most 512 px on its longer side, of which at most 65,536 pixels
  are sampled. If the sampled pixels are all transparent, every pixel is read, so a sparse image does not turn into
  the black of its transparent pixels. They are listed most common first. White counts like any other color
  (colorthief would skip it). An image with no more distinct colors than asked for, such as a logo, gives exactly
  those. A picked point reads one pixel of the copy, which already averages the area of the original beneath it.
  colorthief is loaded with the first image (`loadImageAnalysis`), not with the page.
- **Markers on the image** show where each color of the selection comes from. A picked color is marked where it was
  picked. For a dominant color, the copy is divided into a grid and each cell averaged; of the cells closest to the
  color, the marker takes the one nearest to their middle, so it sits inside the area rather than at its edge. A
  dominant color is an average and may not occur exactly in the image, so its marker shows the closest match. A
  marker that is moved takes the color of the pixel under it and keeps its number; on a transparent spot it keeps the
  color it had. A new number of colors drops the moves, since the dominant colors are found again.

Sources for every method are listed in the README and, for links shown in the interface, in
`src/lib/references.ts`.
