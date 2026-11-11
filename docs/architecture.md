# Architecture

Hueproof is a static site. `next build` writes plain HTML, CSS and JS to `out/` (`output: "export"` in
`next.config.ts`). There is no server, no API route and no database; everything runs in the browser.

## Routes

| Path | Source | Notes |
| --- | --- | --- |
| `/` | `src/app/(en)/` | English |
| `/de/` | `src/app/(de)/de/` | German |
| `/icon.svg`, `/robots.txt`, `/sitemap.xml` | `src/app/` | Written at build time |

All paths are relative to the base path. The site is deployed at `/hueproof` on `tools.codebrauer.com`;
`BASE_PATH` in `src/lib/site.ts` is the path part of `NEXT_PUBLIC_SITE_URL` and goes into `basePath` in
`next.config.ts`. Next adds it to `<Link>`, `router.push`, assets and file-based images, but not to plain
`<a href>` or to the canonical and `hreflang` links in `src/lib/metadata.ts`; those add `BASE_PATH`
themselves. `robots.txt` in a sub-folder is not read by crawlers; the sitemap is still valid.

Each language is a route group with its own root layout, so `<html lang>` is already correct in the
prerendered HTML. Both render the same `HomePage` component with a different locale. `trailingSlash: true`
turns every page into `<path>/index.html`, which any static host can serve.

Without a server there is no language negotiation. `BrowserLanguageRedirect` in the English layout does it in
the browser: on `/`, when no language was picked with the switch and `navigator.languages` names German before
English, it replaces the page with `/de/` and keeps the fragment. The English page shows briefly before that.

`src/lib/metadata.ts` builds title, description, canonical and `hreflang` links per language. The link
preview image is a static PNG per language, because a static site cannot render one per palette.

## Where state lives

| State | Stored in | Code |
| --- | --- | --- |
| Colors and their names | URL fragment and browser history | `src/lib/palette-store.ts`, `src/lib/color/url.ts` |
| Lock flags, color ids | Browser history state only, not part of the link | `src/lib/palette-store.ts` |
| Saved palettes | `localStorage`, key `hueproof:saved-palettes:v1` | `src/lib/storage.ts` |
| Language picked with the switch | `localStorage`, key `hueproof:locale` | `src/i18n/locales.ts` |
| Light or dark theme | `localStorage`, through `next-themes` | `src/components/providers.tsx` |
| Selected tab, vision simulation, open dialog | React state, reset on reload | `src/components/palette-app.tsx` |

## The palette store

`palette-store.ts` is a small store outside React, read through `useSyncExternalStore` (`usePalette`).
During prerendering and the first client render it returns `null`, and the page shows a skeleton.

- Link format: `/#d5ac85-f5e9d9-132c29&n=gold,wei%C3%9F,emerald`. Names are only written when one is set.
  A fragment is never sent to a server.
- Every change is a history entry (`pushState`), so the back button undoes it and any state can be shared
  as a link. Undo and redo call `history.back()` and `history.forward()`.
- Dragging the color picker would flood the history, so those changes are folded into one entry once they
  pause for 400 ms. Locking a color replaces the current entry instead of adding one.
- The first write is deferred by one tick. Next's router hooks into the history API after hydration; a
  write before that would drop the router's own state from the entry.
- Links from before the fragment format (`?c=…&n=…`) still open.

Everything that comes from outside is validated before use: the URL, history state, `localStorage` and
pasted text (`src/lib/import.ts`).

## Layers

```
src/lib/color/    Pure functions on "#rrggbb" strings. No React, no DOM. Unit tested.
src/lib/          Store, import, export, storage, SVG rendering of the palette and logo
src/hooks/        Thin React bindings for the above
src/components/   UI; ui/ holds the shadcn primitives
src/i18n/         Dictionaries and locale helpers
```

`src/lib/site.ts`, `src/lib/palette-image.ts` and `src/lib/color/types.ts` have no imports on purpose:
`scripts/generate-og-image.mjs` runs them directly in Node.
