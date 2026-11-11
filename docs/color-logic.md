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

## Details worth knowing

- **Contrast values are truncated, not rounded,** so a failing 4.499 never reads as a passing 4.5.
- **APCA depends on polarity.** `apcaLc(text, background)` is not symmetric; `pairContrast` takes the weaker
  direction. WCAG ratios are symmetric, so the "Close calls" list shows each WCAG pair once.
- **Achromatopsia** is not part of the Machado model. It is shown as the gray with the same relative
  luminance.
- **A fix changes lightness only.** `findLightnessFix` walks outward from the current OKLCH lightness in
  steps of 0.004, in both directions, and returns the first candidate that passes. Hue and chroma stay;
  chroma is clamped to sRGB. For a confusable pair the fix must not make any other pair worse than it was.
- **The largest safe set** checks every subset. That is fine for at most 10 colors (1,024 subsets).
- **Warmth** is `0.02 · C^1.07 · cos(h − 50°)` in CIELAB LCh. The constant offset of the published model
  is left out, so near-neutral colors read as neutral.
- **Roles are a first guess:** lightest color as background, darkest as text, with five or more colors the
  second lightest as surface, then the most colorful of the rest as primary and accent.

Sources for every method are listed in the README and, for links shown in the interface, in
`src/lib/references.ts`.
