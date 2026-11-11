<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Hueproof

Accessible color palette generator and contrast checker. A static Next.js site (App Router,
`output: "export"`) in English and German, with no backend. Start with `README.md`; the details are in
`docs/` (`architecture.md`, `color-logic.md`, `design.md`, `recipes.md`).

## Commands

Node 24 or newer, pnpm.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest, the color logic and the helpers in `src/lib/` |
| `pnpm build` | Static export to `out/` |
| `pnpm og-image` | Regenerates the icon and the link preview images |

A change is done when lint, typecheck, test and build all pass. For anything visible, also look at it in
the browser: light and dark, English and German, and at 375 px and 320 px width.

## Rules

- **Static only.** No API routes, server actions, middleware, cookies or anything else that needs a server
  at request time. `pnpm build` must keep producing a complete site in `out/`.
- **The URL fragment belongs to the palette.** Never link to `#anchors` and never write `location.hash`
  yourself; change the palette through `paletteActions` in `src/lib/palette-store.ts`.
- **Color logic stays out of components.** Calculations go into `src/lib/color/` as pure functions on
  `#rrggbb` strings, without React or the DOM, each with a test. Extend the existing test files.
- **No magic numbers.** Thresholds and tuning values are named constants with a comment saying whether
  they come from a standard or are a heuristic.
- **Every text goes through the dictionaries.** Add it to `src/i18n/en.tsx`, then `src/i18n/de.tsx`. No
  literal interface text in components. Code, comments and docs are English.
- **Claims need sources.** A figure or statement shown to the user (how common a deficiency is, what a
  color is associated with) links to a publication in `src/lib/references.ts` or
  `src/data/color-meaning.json`. Do not add one from memory; check it.
- **Treat outside data as untrusted.** The URL, history state, `localStorage` and pasted text are
  validated before use. Keep it that way.
- **Follow `docs/design.md`.** No boxes, shadows, pills or literal colors; reuse `Panel`, `Field`,
  `Segmented`, `Choice` and the primitives in `src/components/ui/` before writing new ones.
- **Color is never the only cue,** and the page has to work with a keyboard and at 320 px width.
- **Keep three files import-free:** `src/lib/site.ts`, `src/lib/palette-image.ts` and
  `src/lib/color/types.ts` are run directly by `scripts/generate-og-image.mjs`.
- **Docs move with the code.** When behavior, a threshold, a command or a design rule changes, update the
  README and the matching file in `docs/` in the same change.

## Where things are

```
src/app/           Routes: (en) is /, (de)/de is /de/; globals.css holds the design tokens
src/components/    UI. analysis/ = the four tabs, dialogs/ = import, export, saved palettes, ui/ = primitives
src/lib/color/     Contrast, vision simulation, differences, fixes, formats, naming
src/lib/           Palette store, import, export, storage, SVG rendering
src/i18n/          Dictionaries (en.tsx is the reference) and locale helpers
src/data/          Sourced statements for the Meaning tab
```
