import type { ReactNode } from "react";
import type { ContrastMode } from "@/lib/color/contrast";
import type { PairCategory } from "@/lib/color/difference";
import type { ColorFamily } from "@/lib/color/family";
import type { Role } from "@/lib/color/roles";
import type { Temperature } from "@/lib/color/temperature";
import type { HarmonyId } from "@/lib/color/variations";
import type { VisionGroup, VisionId } from "@/lib/color/vision";
import type { MeaningKind } from "@/lib/color/meaning";
import { SITE_NAME, SITE_TAGLINES } from "@/lib/site";

const count = (value: number, one: string, other: string) => `${value} ${value === 1 ? one : other}`;

export const en = {
  /** Formats a number that was written with a decimal point for this language. */
  decimal: (text: string): string => text,

  meta: {
    title: `${SITE_NAME} – Accessible Color Palette Generator & Contrast Checker`,
    tagline: SITE_TAGLINES.en as string,
    description:
      "Build a color palette and proof it for accessibility: WCAG and APCA contrast, color blindness simulation, one-click fixes, and export to CSS, Tailwind and design tokens. Free, runs in your browser.",
    keywords: [
      "color palette generator",
      "contrast checker",
      "accessible color palette",
      "WCAG contrast",
      "APCA",
      "color blindness simulator",
      "color converter",
    ],
    imageAlt: `${SITE_NAME}: a color palette shown as five vertical stripes with their hex codes.`,
  },

  common: {
    undo: "Undo",
    close: "Close",
    copied: (what: string) => `Copied ${what}`,
    copyFailed: "Could not copy to the clipboard",
  },

  toolbar: {
    generate: "Generate",
    generateLabel: "Generate new colors",
    generateHint: "New colors for every unlocked slot",
    spaceKey: "Space",
    undo: "Undo",
    redo: "Redo",
    addColor: "Add color",
    simulate: "Simulate a color vision type",
    import: "Import",
    saved: "Saved",
    export: "Export",
    share: "Share",
    shareLink: "Share link",
    sharedWhat: "the link to this palette",
    more: "More actions",
    theme: "Switch between light and dark interface",
    paletteFull: (max: number) => `A palette holds up to ${max} colors`,
  },

  column: {
    listLabel: "Palette colors",
    changeColor: (hex: string) => `Change color ${hex}`,
    hexCode: "Hex code",
    namePlaceholder: "Name",
    nameLabel: (hex: string) => `Name of ${hex}`,
    lock: "Lock color (keeps it when generating)",
    unlock: "Unlock color",
    copyHex: "Copy hex code",
    details: "Color details",
    drag: "Drag to reorder",
    remove: "Remove color",
    addAfter: "Add a color after this one",
    add: "Add color",
  },

  status: {
    simulating: (vision: string) => `Simulating ${vision}`,
    reset: "Reset",
    readable: (readable: number, total: number) => `${readable} of ${count(total, "pair", "pairs")} readable (AA)`,
    confusable: (pairs: number) => `${count(pairs, "pair", "pairs")} hard to tell apart`,
    marginal: (pairs: number) => `${count(pairs, "pair", "pairs")} close under color blindness`,
    allDistinct: "All colors distinguishable",
    temperature: (warm: string, cool: string) => `${warm} warm · ${cool} cool`,
    preview: "Card, slide and pattern",
  },

  tabs: {
    label: "Palette analysis",
    contrast: "Contrast",
    vision: "Color vision",
    temperature: "Temperature",
    preview: "Preview",
  },

  tiers: {
    badges: {
      wcag: ["Fail", "AA Large", "AA", "AAA"],
      apca: ["Low", "Lc 60", "Lc 75", "Lc 90"],
    } satisfies Record<ContrastMode, string[]>,
    descriptions: [
      "Not enough contrast for text",
      "Large text only",
      "Good for any text size",
      "Good for any text size (enhanced)",
    ],
  },

  fix: {
    lighten: (name: string) => `Lighten ${name}`,
    darken: (name: string) => `Darken ${name}`,
    changed: (name: string, hex: string) => `Changed ${name} to ${hex}`,
  },

  contrast: {
    method: "Contrast method",
    layout: "Layout",
    matrix: "Matrix",
    cards: "Cards",
    includeExtremes: "Include white and black",
    extras: "Extras",
    allPairs: "All pairs",
    white: "White",
    black: "Black",
    closeCalls: "Close calls",
    closeCallsText:
      "These pairs miss a level by a small margin. One small lightness change fixes each; hue and saturation stay as they are.",
    nearMiss: (first: string, second: string, value: ReactNode, target: ReactNode, symmetric: boolean): ReactNode => (
      <>
        {first} {symmetric ? "and" : "on"} {second}: {value}, needs {target}
      </>
    ),
    noFix: (target: string) => `No lightness change of an unlocked color reaches ${target}.`,
    largeText: "Large text",
    bodySample: "Body text. The quick brown fox jumps over the lazy dog.",
    pair: (text: ReactNode, background: ReactNode): ReactNode => (
      <>
        {text} <span className="text-muted-foreground">on</span> {background}
      </>
    ),
    meetsHighest: "This pair meets the highest level.",
    fixToReach: "Fix to reach",
    matrixCaption: "Contrast of each text color (rows) on each background color (columns)",
    matrixCorner: "Text ↓ on background →",
    cellLabel: (text: string, background: string, value: string, badge: string) =>
      `${text} on ${background}: ${value}, ${badge}`,
    cardGroups: {
      any: "Good for any text size",
      large: "Large text only",
      none: "Not enough contrast",
    },
    legendItem: (badge: string, description: string) => `${badge}: ${description.toLowerCase()}`,
    notes: {
      wcag: "WCAG 2 contrast ratio: 4.5:1 for body text, 3:1 for large text (24px, or 18.66px bold) and interface components, 7:1 for the enhanced level (AAA).",
      apca: "APCA lightness contrast (Lc). It is not part of WCAG 2 and depends on which color is the text: Lc 75 for body text, Lc 60 for large text, Lc 90 preferred for body text.",
    } satisfies Record<ContrastMode, string>,
    selectCell: (source: ReactNode): ReactNode => (
      <>Select a cell to see the pair and get fix suggestions. Source: {source}</>
    ),
  },

  vision: {
    types: {
      normal: { label: "Normal vision", description: "No color vision deficiency" },
      protanopia: { label: "Protanopia", description: "No working red cones" },
      deuteranopia: { label: "Deuteranopia", description: "No working green cones" },
      tritanopia: { label: "Tritanopia", description: "No working blue cones" },
      protanomaly: { label: "Protanomaly", description: "Weakened red cones" },
      deuteranomaly: { label: "Deuteranomaly", description: "Weakened green cones, the most common type" },
      tritanomaly: { label: "Tritanomaly", description: "Weakened blue cones" },
      achromatopsia: { label: "Achromatopsia", description: "No color perception, lightness only" },
    } satisfies Record<VisionId, { label: string; description: string }>,
    groups: {
      typical: "Typical",
      redGreen: "Red-green deficiency",
      blueYellow: "Blue-yellow deficiency",
      monochromacy: "Total color blindness",
    } satisfies Record<VisionGroup, string>,
    prevalence: {
      men: "Men",
      women: "Women",
      everyone: "Everyone",
      redGreen: {
        men: "about 8%",
        women: "about 0.5%",
        note: "Inherited. Figures for Northern European ancestry; about 4 to 6.5% of men of Chinese and Japanese ethnicity.",
      },
      blueYellow: {
        everyone: "under 0.01%",
        note: "Inherited form, men and women alike. The acquired form becomes common with age.",
      },
      monochromacy: { everyone: "about 0.003%", note: "About 1 in 30,000 people, men and women alike." },
      age: (study: ReactNode): ReactNode => (
        <>
          Color vision also declines with age. In a study of 865 people aged 58 to 102, 36% failed a sensitive color
          test and 21% the standard version. About three quarters of them confused blues and yellows, and the share
          rose markedly with age ({study}).
        </>
      ),
      sources: (general: ReactNode, achromatopsia: ReactNode, populations: ReactNode): ReactNode => (
        <>
          Frequencies: {general}, {achromatopsia}, {populations}.
        </>
      ),
    },
    looksTitle: "How the palette looks",
    looksText: "Select a row to view the whole palette above with that type of color vision.",
    appearsAs: (name: string, hex: string, simulated: string) => `${name}: ${hex} appears as ${simulated}`,
    pairsTitle: "Can every pair be told apart?",
    pairsText:
      "A legend or chart only works when any two colors stay different. Each value is the smallest color difference (ΔE) across all vision types above.",
    stats: {
      checked: "Pairs checked",
      confusable: "Hard to tell apart",
      safeSet: "Largest safe set",
      closest: "Closest pair (ΔE)",
    },
    matrixCaption: "Smallest color difference between each pair of palette colors",
    categories: {
      confusable: "Hard to tell apart",
      marginal: "Close",
      distinct: "Distinct",
    } satisfies Record<PairCategory, string>,
    cellTitle: (category: string, vision: string) => `${category}. Smallest with ${vision.toLowerCase()}.`,
    legend: {
      confusable: (below: number) => `✕ hard to tell apart (ΔE below ${below})`,
      marginal: (below: number) => `≈ close (ΔE below ${below})`,
      distinct: "no symbol: distinct",
    },
    fixTitle: "Pairs to fix",
    nothingToFix: "No pair collapses under any vision type.",
    fixText:
      "Color blindness removes differences in hue but keeps differences in lightness. Making one color of a pair lighter or darker separates them for every vision type.",
    pairLine: (first: string, second: string, difference: ReactNode, vision: string): ReactNode => (
      <>
        {first} and {second}: ΔE {difference} with {vision.toLowerCase()}
      </>
    ),
    noFix: "No lightness change of an unlocked color separates them without a new conflict.",
    safeTitle: "Largest set that works together",
    safeAll: "All colors can carry meaning side by side.",
    safeSome: (safe: number, total: number) =>
      `${safe} of ${total} colors can carry meaning side by side. Give the others a second cue such as a label, an icon or a pattern.`,
    method: (model: ReactNode, difference: ReactNode, confusable: number, marginal: number): ReactNode => (
      <>
        Simulation after {model}; anomalous types use half severity, and achromatopsia is shown as lightness only.
        Differences are {difference}. The thresholds of {confusable} and {marginal} are rules of thumb, not a
        standard, and a simulation cannot show what an individual person sees.
      </>
    ),
  },

  temperature: {
    labels: { warm: "Warm", neutral: "Neutral", cool: "Cool" } satisfies Record<Temperature, string>,
    balance: "Balance",
    each: "Each color",
    note: (source: ReactNode): ReactNode => (
      <>
        An estimate, not a measurement: there is no standard for color temperature of surface colors. It follows the
        colour-heat model of {source}, in which warmth grows with saturation and peaks at orange-red hues. Colors with
        little saturation read as neutral here.
      </>
    ),
  },

  preview: {
    roles: {
      background: "Background",
      surface: "Surface",
      text: "Text",
      primary: "Primary",
      accent: "Accent",
    } satisfies Record<Role, string>,
    rolesLabel: "Roles",
    resetRoles: "Reset roles",
    visuals: { card: "Business card", slide: "Presentation slide", pattern: "Pattern" },
    cardName: "Alex Morgan",
    cardRole: "Design Lead",
    cardStudio: "studio",
    slideKicker: "Brand review",
    slideTitle: ["Colors that", "work together"],
    slideText: "One palette for every touchpoint.",
    checksTitle: "Contrast of these roles",
    checks: {
      textOnBackground: "Text on background",
      textOnSurface: "Text on surface",
      buttonLabel: "Label on primary",
      link: "Primary on background",
      badgeLabel: "Label on accent",
    },
    note: "Roles are a first guess from lightness and saturation. Labels on primary and accent use the background or text color, whichever is easier to read.",
  },

  drawer: {
    tabs: {
      formats: "Formats",
      variations: "Variations",
      harmonies: "Harmonies",
      vision: "Vision",
      meaning: "Meaning",
    },
    currentColor: (hex: string) => `${hex}, current color`,
    copyHex: "Copy hex code",
    replace: (name: string) => `Replace ${name}`,
    addToPalette: "Add to palette",
    copyRow: "Select to copy",
    copyAsCss: (format: string) => `Copy ${format} as CSS`,
    withHash: "with #",
    copyWithHash: "Copy hex code with #",
    formatsNote:
      "Select a row to copy its values, comma-separated; “with #” copies the hex code with its hash, “CSS” the CSS notation. LAB, LCH and LUV use the D50 white point as CSS does, XYZ uses D65. CMYK is an approximation without a print profile.",
    inUse: "In use",
    textOnWhite: "Text on white",
    textOnBlack: "Text on black",
    asBackground: "Background",
    asBorder: "Border",
    shades: "Shades",
    shadesHint: "mixed with black",
    tints: "Tints",
    tintsHint: "mixed with white",
    tones: "Tones",
    tonesHint: "gray to fully saturated",
    similar: "Similar",
    similarHint: "neighbouring hues",
    variationsNote: "Select a swatch to copy it, use it instead, or add it to the palette.",
    harmonies: {
      complementary: "Complementary",
      analogous: "Analogous",
      split: "Split complementary",
      triadic: "Triadic",
      tetradic: "Tetradic",
      square: "Square",
      monochromatic: "Monochromatic",
    } satisfies Record<HarmonyId, string>,
    useAsPalette: "Use as palette",
    paletteReplaced: "Palette replaced",
    harmoniesNote: "Harmonies rotate the hue on the HSL color wheel, the convention most color tools share.",
    visionNote: "Left: the color. Right: how it appears with that type of vision.",
    closestFamily: "Closest basic color",
    families: {
      red: "Red",
      orange: "Orange",
      yellow: "Yellow",
      green: "Green",
      blue: "Blue",
      purple: "Purple",
      pink: "Pink",
      brown: "Brown",
      black: "Black",
      white: "White",
      gray: "Gray",
    } satisfies Record<ColorFamily, string>,
    meaningNote: (review: ReactNode): ReactNode => (
      <>
        What a color means depends on context, culture and the exact shade. The statements below describe the color
        family in general, and each links to its source. A review of the field calls the research young and advises
        caution before applying it ({review}).
      </>
    ),
    noMeaning: "There are no sourced statements for this color family yet.",
    kinds: { study: "Study", review: "Review", convention: "Convention" } satisfies Record<MeaningKind, string>,
  },

  exportDialog: {
    title: "Export palette",
    description: "Copy the code or download it as a file. Variable names come from the color names.",
    format: "Export format",
    previewAlt: "Preview of the palette image",
    downloadPng: "Download PNG",
    download: (filename: string) => `Download ${filename}`,
    copy: "Copy",
    copiedWhat: (format: string) => `${format} code`,
    imageFailed: "The image could not be created in this browser",
  },

  importDialog: {
    title: "Import colors",
    description: (max: number) =>
      `Paste hex codes separated by commas, spaces or line breaks (with or without #), CSS, lines like “name: #hex”, or a palette link from ${SITE_NAME} or Coolors. Up to ${max} colors.`,
    inputLabel: "Colors to import",
    needTwo: "A palette needs at least two colors.",
    noneFound: "No hex colors found in this text.",
    replace: "Replace current palette",
    imported: (colors: number) => `Imported ${colors} colors`,
  },

  library: {
    title: "Saved palettes",
    description: "Stored in this browser only. To keep a palette elsewhere, share its link or export it.",
    namePlaceholder: "Name for the current palette (optional)",
    nameLabel: "Name for the current palette",
    save: "Save current",
    empty: "No saved palettes yet.",
    untitled: "Untitled palette",
    remove: (title: string) => `Delete ${title}`,
    saved: "Palette saved in this browser",
    storageError: "This browser did not allow saving (private mode or full storage)",
    loaded: (title: string) => `Loaded ${title}`,
    deleted: (title: string) => `Deleted ${title}`,
  },

  info: {
    kicker: "This is",
    start: "Start with your colors",
    heading: "Accessible color palette generator and contrast checker",
    intro: `${SITE_NAME} lets you build a color palette and proof it before you ship it: is the text readable, can people with color blindness tell the colors apart, and what is the smallest change that fixes a problem? It is free and runs entirely in your browser.`,
    featuresLabel: "Features",
    features: [
      {
        title: "Build and name a palette",
        text: "Pick colors, lock the ones you like and generate the rest. Reorder by dragging. Every color gets a name suggestion you can overwrite.",
      },
      {
        title: "Check text contrast",
        text: "See every color on every other color with its WCAG 2 ratio or APCA value, as a matrix or as cards.",
      },
      {
        title: "Simulate color blindness",
        text: "View the palette with seven types of color vision deficiency and find the pairs that become hard to tell apart.",
      },
      {
        title: "Fix problems in one step",
        text: "For a pair that just misses a contrast level or collapses under color blindness, get the smallest lightness change that solves it.",
      },
      {
        title: "Inspect a single color",
        text: "Convert to HEX, RGB, HSL, HWB, CMYK, LAB, LCH, LUV, XYZ and OKLCH, and explore shades, tints, tones and harmonies.",
      },
      {
        title: "Share and export",
        text: "The palette is part of the link, so sharing is copying the address. Export CSS variables, SCSS, Tailwind, JSON, design tokens, SVG or PNG.",
      },
    ],
    questions: "Questions",
    faq: {
      storage: {
        question: "Is my palette stored on a server?",
        answer: `No. ${SITE_NAME} has no server and no accounts. The palette lives in the link, and palettes you save stay in your browser's local storage.`,
      },
      method: {
        question: "Should I use WCAG or APCA?",
        answer: (wcag: ReactNode, apca: ReactNode): ReactNode => (
          <>
            Accessibility regulations refer to WCAG 2 ({wcag}), so use its ratio when you need to conform. {apca} is a
            newer method that takes into account which color is the text. It is not part of WCAG 2 and is best used as
            a second opinion.
          </>
        ),
      },
      simulation: {
        question: "How accurate is the color blindness simulation?",
        answer: (model: ReactNode): ReactNode => (
          <>
            It follows a published model ({model}) and is good at revealing pairs that collapse into one color. It
            cannot show what an individual person sees, and screens differ.
          </>
        ),
      },
      fix: {
        question: "What does the fix change?",
        answer:
          "Only lightness, in the OKLCH color space, by the smallest amount that reaches the target. Hue and saturation stay, so the color remains recognisable.",
      },
    },
    footer: `${SITE_NAME} runs in your browser. Nothing you enter is sent anywhere.`,
  },
};

export type Dictionary = typeof en;
