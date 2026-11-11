# Design

One idea: paper and ink. The interface has no hue of its own, so it never tints the colors being judged.
The page is a white sheet on a four-column grid, and the palette is the only color on it.

## Rules

- **No boxes, no shadows.** Sections are separated by hairline rules (`border-t border-border`), not by
  cards. There are no vertical guide lines. The strong rule (`border-foreground`) appears twice: above the
  tabs and above the description at the end of the page.
- **Label left, content right.** A section puts its heading in the first of four columns and its content
  in the other three. Below 768 px the two stack.
- **Words instead of chrome.** Tabs are large words. Settings are plain words, the chosen one underlined.
  Toolbar actions are quiet words. There is one filled button style.
- **Small, consistent radii.** 10 px for buttons, pictures and the outer corners of the palette, 8 px for
  cells and strips, a few pixels for badges and swatch squares. Only dots are round. No pills.
- **One accent.** The dot after the wordmark and after the selected tab takes its color from the palette
  (`--palette-accent`, set in `palette-app.tsx`). Nothing else in the interface is colored.
- **Color is never the only cue.** Contrast levels carry an icon, difference categories a symbol.

## Type

| Typeface | Used for | Notes |
| --- | --- | --- |
| Cal Sans | Headlines, tabs, wordmark, hex codes | One weight. Do not add `font-bold` or similar; `font-synthesis-weight: none` keeps the browser from faking one |
| Fira Sans | Everything else | 400, 500, 600, 700. Numbers use `tabular-nums` |
| System monospace | Code in the export dialog only | Not loaded, so there is no third webfont |

Both webfonts load through `next/font` in `src/app/fonts.ts`. Small labels are 11 px, semibold, uppercase,
with wide tracking.

## Tokens

Colors, radii and fonts are CSS variables in `src/app/globals.css`, with a `.dark` set for the dark
theme. Use the Tailwind names that map to them (`bg-background`, `text-muted-foreground`, `border-border`,
`rounded-lg`), never a literal color. `text-quiet` is for inactive large words only; it does not have enough
contrast for small text.

## Building blocks

| Component | File | Use |
| --- | --- | --- |
| `Panel` | `src/components/panel.tsx` | A section of an analysis tab. `wide` puts the content below the heading, for tables |
| `Field` | `src/components/panel.tsx` | One line of settings: small label, control beside it |
| `Segmented`, `Choice` | `src/components/segmented.tsx` | Text toggles: one of several, or a single on/off |
| `Button` | `src/components/ui/button.tsx` | `default` filled, `outline` for secondary actions, `ghost` for quiet words and icons |
| `SwatchLabel` | `src/components/swatch-label.tsx` | A palette color referred to in text |
| `TierBadge` | `src/components/analysis/tier-badge.tsx` | Contrast level with its icon |

The page width (`max-w-[88rem]`) and side padding are set once, in `src/components/home-page.tsx`.

## Small screens

The palette stacks, with the labels inside the swatches. The toolbar must fit a 320 px wide screen: below
768 px import, saved palettes, export, share and the theme toggle move into a menu; below 640 px redo
follows and Generate shrinks to an icon. Check both 375 px and 320 px after changing the toolbar.
