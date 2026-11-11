# Hueproof

Accessible color palette generator and contrast checker. Build a palette, then proof it:
text contrast (WCAG 2 and APCA), color blindness simulation, one-click lightness fixes,
color conversions and export. No backend: the palette lives in the URL fragment
(`/#d5ac85-f5e9d9-132c29`), saved palettes in `localStorage`.

## Features

- Palette of 2–10 colors: pick, name, lock, reorder by drag, generate the unlocked ones (Space).
  A link without a palette starts with random colors
- Every change is a browser history entry: undo with the back button or ⌘Z, share by copying the URL.
  The palette sits after the `#`, so it is never sent to a server; older `?c=` links still open
- Contrast matrix and cards (WCAG 2 or APCA), with fix suggestions for pairs that narrowly miss a level
- Color vision: seven simulated deficiencies with how common each group is, pairwise ΔE, largest set
  without a confusable pair
- Warm/cool balance; preview as business card, presentation slide and pattern with role assignment
- Per color: HEX, RGB, HSL, HWB, CMYK, LAB, LCH, LUV, XYZ, OKLCH; shades, tints, tones, harmonies; sourced notes on meaning
- Import from pasted text (hex codes separated by commas, spaces or lines, CSS, `name: #hex`, Coolors links)
- English (`/`) and German (`/de/`), each prerendered, with `hreflang` links; switching keeps the palette.
  A first visit to `/` moves on to `/de/` when the browser prefers German; a language picked with the switch wins
- Export: CSS variables, SCSS, Tailwind v4 theme, JSON, W3C design tokens, SVG, PNG

## Development

Node 24+ and pnpm.

```bash
pnpm install
pnpm dev
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm test` | Unit tests for the color logic (Vitest) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm build` | Static export to `out/` |
| `pnpm og-image` | Regenerates the app icon and the link preview image of each language from the default palette |
| `pnpm ship` | Checks, builds and copies the site to the web server (see Deployment) |

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public address of the site without a trailing slash. Used for the absolute Open Graph image link, canonical and `hreflang` links, `robots.txt` and the sitemap. Its path, if any, becomes Next's `basePath` (`https://tools.codebrauer.com/hueproof` → `/hueproof`). Defaults to `http://localhost:3000`. |

Copy `.env.example` to `.env.local` for local builds.

## Deployment

Live at **https://tools.codebrauer.com/hueproof/**, a sub-folder of the `tools.codebrauer.com` site:
static files served by a web server from
`/var/www/example.com/hueproof/`.

```bash
pnpm ship
```

`scripts/deploy.sh` runs lint, typecheck and tests, builds with
`NEXT_PUBLIC_SITE_URL=https://tools.codebrauer.com/hueproof`, copies `out/` with `rsync --delete` over SSH
and checks that both languages answer. `SITE_URL`, `DEPLOY_HOST` and `DEPLOY_PATH` override the defaults.
Needs SSH access to the server with your own key.

`pnpm build` writes a fully static site to `out/`, so any other static host works too. To serve it at
the root of a domain, set `NEXT_PUBLIC_SITE_URL` without a path. `.github/workflows/ci.yml` runs the
checks and a build on every push; it does not deploy.

Because the site is static, the link preview image is the same for every shared palette (one per language).

## Languages

All interface texts live in `src/i18n/en.tsx` and `src/i18n/de.tsx`. The German dictionary is typed against the
English one, so a missing or misspelled key fails `pnpm typecheck`. Texts with variable parts are functions, so
each language can order and inflect a sentence as it needs.

To add a language: add it to `LOCALES` and `LOCALE_PATHS` in `src/i18n/locales.ts`, add a dictionary, a route
group with its own layout and page under `src/app/` (see `(de)`), translations in `src/data/color-meaning.json`,
and a tagline in `src/lib/site.ts` (then run `pnpm og-image`).

Suggested color names come from an English list and are not translated.

## Design

Paper and ink: the interface has no hue of its own, so it never tints the colors being judged. A white page
on a four-column grid, without boxes or shadows; hairline rules between rows, tabs and settings as words,
small consistent corner radii. The one accent, the dot after the wordmark and the selected tab, takes its
color from the palette. Two typefaces: Cal Sans for headlines and Fira Sans for everything else. The logo
is a ring of the current palette's colors with a check mark. The rules are in [docs/design.md](docs/design.md).

## Documentation

| File | Content |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Static export, routes, where state lives, the palette store |
| [docs/color-logic.md](docs/color-logic.md) | What each color module calculates, and which numbers are standards or heuristics |
| [docs/design.md](docs/design.md) | Design rules, type, tokens, building blocks |
| [docs/recipes.md](docs/recipes.md) | How to add a text, an export format, an analysis tab, a source |
| [AGENTS.md](AGENTS.md) | Working rules for coding agents |

## Structure

```
src/app/           One route group per language, each with its own root layout
src/i18n/          Dictionaries and locale helpers
src/lib/color/     Color logic without UI: contrast, vision simulation, fixes, formats, URL
src/lib/           Palette store (URL + history), import, export, storage
src/components/    UI; analysis/ holds the four analysis tabs, dialogs/ the import, export and library dialogs
src/data/          Sourced statements shown in the "Meaning" tab, in both languages
scripts/           Open Graph image generator
docs/              Short documents on architecture, color logic, design and common changes
```

## Methods and sources

- Contrast: [WCAG 2.2, SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum); [APCA](https://github.com/Myndex/SAPC-APCA) via `apca-w3`
- Color vision simulation: Machado, Oliveira & Fernandes (2009), https://doi.org/10.1109/TVCG.2009.113, via `culori`
- Color difference: CIEDE2000, https://doi.org/10.1002/col.20070. The thresholds for "hard to tell apart" (10) and "close" (20) are heuristics.
- Warm/cool: based on the colour-heat model of Ou et al. (2004), https://doi.org/10.1002/col.20010, without its constant offset
- How common color vision deficiencies are: [MedlinePlus Genetics](https://medlineplus.gov/genetics/condition/color-vision-deficiency/)
  (NIH), Birch (2012), https://doi.org/10.1364/JOSAA.29.000313; with age: Schneck et al. (2014),
  https://doi.org/10.1097/OPX.0000000000000152
- Color names: [`color-name-list`](https://github.com/meodai/color-names) (MIT)
- Meaning tab (`src/data/color-meaning.json`): every statement cites a peer-reviewed publication or an official
  text. All DOIs were checked against Crossref; findings that failed to replicate are either left out or shown
  with that caveat.

`apca-w3` is published under its own license, which limits use to web content contrast checks; see the package.
