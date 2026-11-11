# Recipes

Short how-tos for the changes that come up most. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and
`pnpm build` afterwards.

## Add or change an interface text

1. Add the key to `src/i18n/en.tsx`.
2. Add the same key to `src/i18n/de.tsx`. The German dictionary is typed against the English one, so
   `pnpm typecheck` fails until both match.
3. Read it with `useT()` in a client component, or `getDictionary(locale)` in a server component.

A sentence with variable parts is a function, so each language can order the words as it needs. Use
`t.decimal()` and `formatPercent()` for numbers; German uses a decimal comma.

## Add an export format

Add an entry to `EXPORT_FORMATS` in `src/lib/export.ts` (`id`, `label`, `filename`, `mimeType`, `build`).
The export dialog lists it automatically. Add a test to `src/lib/lib.test.ts`.

## Add an analysis tab

1. Add the id to `AnalysisTab` and `ANALYSIS_TABS` in `src/components/palette-app.tsx`.
2. Add its headline finding to `tabStatus` there, and the texts to `tabs` and `status` in both dictionaries.
3. Build the panel in `src/components/analysis/` from `Panel` and `Field` (see [design.md](design.md)).
4. Add a `TabsPrimitive.Content` for it in `palette-app.tsx`.

Put the calculation in `src/lib/color/` with a test, not in the component.

## Add a statement to the Meaning tab

Add it to the color family in `src/data/color-meaning.json`: `claim` and optional `caveat` in both
languages, `kind` (`study`, `review` or `convention`) and at least one entry in `sources` with authors,
year, title and a working URL. Only add what a peer-reviewed publication or an official text supports,
and check the DOI.

## Cite a source in the interface

Add it to `REFERENCES` in `src/lib/references.ts` and render it with `SourceLink`.

## Change the default palette, the name or a tagline

Edit `DEFAULT_PALETTE` in `src/lib/color/types.ts` or the constants in `src/lib/site.ts`, then run
`pnpm og-image`. It rewrites `src/app/icon.svg` and the link preview image of each language in `public/og/`.

## Add a language

See "Languages" in the [README](../README.md).

## Add a UI primitive

`pnpm exec shadcn add <name>` writes it to `src/components/ui/`. Afterwards bring it in line with
[design.md](design.md): radii from the tokens, no shadow, no filled background bands.
