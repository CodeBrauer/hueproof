import { SITE_NAME, SITE_TAGLINES } from "@/lib/site";
import type { Dictionary } from "./en";

const count = (value: number, one: string, other: string) => `${value} ${value === 1 ? one : other}`;

export const de: Dictionary = {
  decimal: (text) => text.replace(/(\d)\.(\d)/g, "$1,$2"),

  meta: {
    title: `${SITE_NAME} – Barrierefreie Farbpaletten erstellen & Kontrast prüfen`,
    tagline: SITE_TAGLINES.de,
    description:
      "Farbpalette erstellen und auf Barrierefreiheit prüfen: WCAG- und APCA-Kontrast, Simulation von Farbsehschwächen, Korrekturen mit einem Klick und Export als CSS, Tailwind und Design Tokens. Kostenlos, läuft komplett im Browser.",
    keywords: [
      "Farbpalette Generator",
      "Kontrast prüfen",
      "Kontrastrechner",
      "barrierefreie Farben",
      "WCAG Kontrast",
      "APCA",
      "Farbenblindheit Simulator",
      "Farben umrechnen",
    ],
  },

  common: {
    undo: "Rückgängig",
    close: "Schließen",
    copied: (what) => `${what} kopiert`,
    copyFailed: "Kopieren in die Zwischenablage nicht möglich",
  },

  toolbar: {
    generate: "Generieren",
    generateLabel: "Neue Farben generieren",
    generateHint: "Neue Farben für alle nicht gesperrten Plätze",
    spaceKey: "Leertaste",
    undo: "Rückgängig",
    redo: "Wiederholen",
    addColor: "Farbe hinzufügen",
    simulate: "Farbsehen simulieren",
    import: "Import",
    saved: "Gespeichert",
    export: "Export",
    share: "Teilen",
    shareLink: "Link teilen",
    sharedWhat: "Link zu dieser Palette",
    more: "Weitere Aktionen",
    theme: "Zwischen heller und dunkler Oberfläche wechseln",
    paletteFull: (max) => `Eine Palette fasst höchstens ${max} Farben`,
  },

  column: {
    listLabel: "Farben der Palette",
    changeColor: (hex) => `Farbe ${hex} ändern`,
    hexCode: "Hex-Code",
    namePlaceholder: "Name",
    nameLabel: (hex) => `Name von ${hex}`,
    lock: "Farbe sperren (bleibt beim Generieren erhalten)",
    unlock: "Farbe entsperren",
    copyHex: "Hex-Code kopieren",
    details: "Details zur Farbe",
    drag: "Zum Umsortieren ziehen",
    remove: "Farbe entfernen",
    addAfter: "Farbe hinter dieser einfügen",
    add: "Farbe hinzufügen",
  },

  status: {
    simulating: (vision) => `Simulation: ${vision}`,
    reset: "Zurücksetzen",
    readable: (readable, total) => `${readable} von ${count(total, "Paar", "Paaren")} lesbar (AA)`,
    confusable: (pairs) => `${count(pairs, "Paar", "Paare")} schwer unterscheidbar`,
    marginal: (pairs) => `${count(pairs, "Paar", "Paare")} bei Farbsehschwäche knapp`,
    allDistinct: "Alle Farben unterscheidbar",
    temperature: (warm, cool) => `${warm} warm · ${cool} kühl`,
    preview: "Karte, Folie und Muster",
  },

  tabs: {
    label: "Analyse der Palette",
    contrast: "Kontrast",
    vision: "Farbsehen",
    temperature: "Temperatur",
    preview: "Vorschau",
  },

  tiers: {
    badges: {
      wcag: ["Ungenügend", "AA groß", "AA", "AAA"],
      apca: ["Gering", "Lc 60", "Lc 75", "Lc 90"],
    },
    descriptions: [
      "Zu wenig Kontrast für Text",
      "Nur für große Schrift",
      "Für jede Schriftgröße geeignet",
      "Für jede Schriftgröße geeignet (erhöht)",
    ],
  },

  fix: {
    lighten: (name) => `${name} aufhellen`,
    darken: (name) => `${name} abdunkeln`,
    changed: (name, hex) => `${name} auf ${hex} geändert`,
  },

  contrast: {
    method: "Kontrastverfahren",
    layout: "Darstellung",
    matrix: "Matrix",
    cards: "Karten",
    includeExtremes: "Weiß und Schwarz einbeziehen",
    extras: "Zusatz",
    allPairs: "Alle Paare",
    white: "Weiß",
    black: "Schwarz",
    closeCalls: "Knapp verfehlt",
    closeCallsText:
      "Diese Paare verfehlen eine Stufe nur knapp. Eine kleine Änderung der Helligkeit behebt das; Farbton und Sättigung bleiben erhalten.",
    nearMiss: (first, second, value, target, symmetric) => (
      <>
        {first} {symmetric ? "und" : "auf"} {second}: {value}, nötig sind {target}
      </>
    ),
    noFix: (target) => `Keine Helligkeitsänderung einer nicht gesperrten Farbe erreicht ${target}.`,
    largeText: "Große Schrift",
    bodySample: "Fließtext. Franz jagt im komplett verwahrlosten Taxi quer durch Bayern.",
    pair: (text, background) => (
      <>
        {text} <span className="text-muted-foreground">auf</span> {background}
      </>
    ),
    meetsHighest: "Dieses Paar erreicht die höchste Stufe.",
    fixToReach: "Korrigieren auf",
    matrixCaption: "Kontrast jeder Textfarbe (Zeilen) auf jeder Hintergrundfarbe (Spalten)",
    matrixCorner: "Text ↓ auf Hintergrund →",
    cellLabel: (text, background, value, badge) => `${text} auf ${background}: ${value}, ${badge}`,
    cardGroups: {
      any: "Für jede Schriftgröße geeignet",
      large: "Nur für große Schrift",
      none: "Zu wenig Kontrast",
    },
    legendItem: (badge, description) => `${badge}: ${description}`,
    notes: {
      wcag: "Kontrastverhältnis nach WCAG 2: 4,5:1 für Fließtext, 3:1 für große Schrift (24 px, oder 18,66 px fett) und Bedienelemente, 7:1 für die erhöhte Stufe (AAA).",
      apca: "APCA-Helligkeitskontrast (Lc). Er ist nicht Teil von WCAG 2 und hängt davon ab, welche Farbe der Text ist: Lc 75 für Fließtext, Lc 60 für große Schrift, Lc 90 empfohlen für Fließtext.",
    },
    selectCell: (source) => (
      <>Wähle eine Zelle, um das Paar zu sehen und Korrekturvorschläge zu erhalten. Quelle: {source}</>
    ),
  },

  vision: {
    types: {
      normal: { label: "Normales Farbsehen", description: "Keine Farbsehschwäche" },
      protanopia: { label: "Protanopie", description: "Keine funktionierenden Rot-Zapfen" },
      deuteranopia: { label: "Deuteranopie", description: "Keine funktionierenden Grün-Zapfen" },
      tritanopia: { label: "Tritanopie", description: "Keine funktionierenden Blau-Zapfen" },
      protanomaly: { label: "Protanomalie", description: "Geschwächte Rot-Zapfen" },
      deuteranomaly: { label: "Deuteranomalie", description: "Geschwächte Grün-Zapfen, die häufigste Form" },
      tritanomaly: { label: "Tritanomalie", description: "Geschwächte Blau-Zapfen" },
      achromatopsia: { label: "Achromatopsie", description: "Keine Farbwahrnehmung, nur Helligkeit" },
    },
    groups: {
      typical: "Typisch",
      redGreen: "Rot-Grün-Schwäche",
      blueYellow: "Blau-Gelb-Schwäche",
      monochromacy: "Totale Farbenblindheit",
    },
    prevalence: {
      men: "Männer",
      women: "Frauen",
      everyone: "Alle",
      redGreen: {
        men: "ca. 8 %",
        women: "ca. 0,5 %",
        note: "Angeboren. Werte für nordeuropäische Abstammung; etwa 4 bis 6,5 % der Männer chinesischer und japanischer Herkunft.",
      },
      blueYellow: {
        everyone: "unter 0,01 %",
        note: "Angeborene Form, bei Männern und Frauen gleich häufig. Die erworbene Form wird im Alter häufig.",
      },
      monochromacy: { everyone: "ca. 0,003 %", note: "Etwa 1 von 30.000 Menschen, Männer und Frauen gleich häufig." },
      age: (study) => (
        <>
          Das Farbsehen lässt auch im Alter nach. In einer Studie mit 865 Menschen zwischen 58 und 102 Jahren fielen
          36 % durch einen empfindlichen Farbtest und 21 % durch die Standardversion. Etwa drei Viertel von ihnen
          verwechselten Blau- und Gelbtöne, und der Anteil stieg mit dem Alter deutlich ({study}).
        </>
      ),
      sources: (general, achromatopsia, populations) => (
        <>
          Häufigkeiten: {general}, {achromatopsia}, {populations}.
        </>
      ),
    },
    looksTitle: "So sieht die Palette aus",
    looksText: "Wähle eine Zeile, um die ganze Palette oben mit dieser Art des Farbsehens zu betrachten.",
    appearsAs: (name, hex, simulated) => `${name}: ${hex} erscheint als ${simulated}`,
    pairsTitle: "Lässt sich jedes Paar unterscheiden?",
    pairsText:
      "Eine Legende oder ein Diagramm funktioniert nur, wenn zwei beliebige Farben verschieden bleiben. Jeder Wert ist der kleinste Farbabstand (ΔE) über alle Arten des Farbsehens oben.",
    stats: {
      checked: "Geprüfte Paare",
      confusable: "Schwer unterscheidbar",
      safeSet: "Größte sichere Gruppe",
      closest: "Engstes Paar (ΔE)",
    },
    matrixCaption: "Kleinster Farbabstand zwischen jedem Paar der Palette",
    categories: {
      confusable: "Schwer unterscheidbar",
      marginal: "Knapp",
      distinct: "Gut unterscheidbar",
    },
    cellTitle: (category, vision) => `${category}. Am kleinsten bei ${vision}.`,
    legend: {
      confusable: (below) => `✕ schwer unterscheidbar (ΔE unter ${below})`,
      marginal: (below) => `≈ knapp (ΔE unter ${below})`,
      distinct: "ohne Symbol: gut unterscheidbar",
    },
    fixTitle: "Zu korrigierende Paare",
    nothingToFix: "Kein Paar verschmilzt bei irgendeiner Art des Farbsehens.",
    fixText:
      "Eine Farbsehschwäche nimmt Unterschiede im Farbton, lässt aber Unterschiede in der Helligkeit bestehen. Wird eine Farbe eines Paares heller oder dunkler, sind beide für jede Art des Farbsehens unterscheidbar.",
    pairLine: (first, second, difference, vision) => (
      <>
        {first} und {second}: ΔE {difference} bei {vision}
      </>
    ),
    noFix: "Keine Helligkeitsänderung einer nicht gesperrten Farbe trennt die beiden, ohne einen neuen Konflikt zu erzeugen.",
    safeTitle: "Größte Gruppe, die zusammen funktioniert",
    safeAll: "Alle Farben können nebeneinander Bedeutung tragen.",
    safeSome: (safe, total) =>
      `${safe} von ${total} Farben können nebeneinander Bedeutung tragen. Gib den übrigen ein zweites Merkmal, etwa eine Beschriftung, ein Symbol oder ein Muster.`,
    method: (model, difference, confusable, marginal) => (
      <>
        Simulation nach {model}; anomale Formen mit halber Ausprägung, Achromatopsie als reine Helligkeit. Abstände
        nach {difference}. Die Schwellen {confusable} und {marginal} sind Faustregeln, kein Standard, und eine
        Simulation kann nicht zeigen, was ein einzelner Mensch sieht.
      </>
    ),
  },

  temperature: {
    labels: { warm: "Warm", neutral: "Neutral", cool: "Kühl" },
    balance: "Verteilung",
    each: "Einzelne Farben",
    note: (source) => (
      <>
        Eine Schätzung, keine Messung: Für die Farbtemperatur von Körperfarben gibt es keinen Standard. Grundlage ist
        das Colour-Heat-Modell von {source}, in dem die Wärme mit der Sättigung zunimmt und bei orangeroten Farbtönen
        am höchsten ist. Farben mit wenig Sättigung gelten hier als neutral.
      </>
    ),
  },

  preview: {
    roles: {
      background: "Hintergrund",
      surface: "Fläche",
      text: "Text",
      primary: "Primär",
      accent: "Akzent",
    },
    rolesLabel: "Rollen",
    resetRoles: "Rollen zurücksetzen",
    visuals: { card: "Visitenkarte", slide: "Präsentationsfolie", pattern: "Muster" },
    cardName: "Alex Morgan",
    cardRole: "Designleitung",
    cardStudio: "studio",
    slideKicker: "Marken-Check",
    slideTitle: ["Farben, die", "zusammenpassen"],
    slideText: "Eine Palette für alle Anwendungen.",
    checksTitle: "Kontrast dieser Rollen",
    checks: {
      textOnBackground: "Text auf Hintergrund",
      textOnSurface: "Text auf Fläche",
      buttonLabel: "Beschriftung auf Primär",
      link: "Primär auf Hintergrund",
      badgeLabel: "Beschriftung auf Akzent",
    },
    note: "Die Rollen sind ein erster Vorschlag aus Helligkeit und Sättigung. Beschriftungen auf Primär und Akzent nutzen die Hintergrund- oder die Textfarbe, je nachdem, welche besser lesbar ist.",
  },

  drawer: {
    tabs: {
      formats: "Formate",
      variations: "Varianten",
      harmonies: "Harmonien",
      vision: "Farbsehen",
      meaning: "Bedeutung",
    },
    currentColor: (hex) => `${hex}, aktuelle Farbe`,
    copyHex: "Hex-Code kopieren",
    replace: (name) => `${name} ersetzen`,
    addToPalette: "Zur Palette hinzufügen",
    copyRow: "Zum Kopieren auswählen",
    copyAsCss: (format) => `${format} als CSS kopieren`,
    formatsNote:
      "Wähle eine Zeile, um ihre Werte kommagetrennt zu kopieren; „CSS“ kopiert die CSS-Schreibweise. LAB, LCH und LUV verwenden wie CSS den Weißpunkt D50, XYZ verwendet D65. CMYK ist eine Näherung ohne Druckprofil.",
    inUse: "Im Einsatz",
    textOnWhite: "Text auf Weiß",
    textOnBlack: "Text auf Schwarz",
    asBackground: "Hintergrund",
    asBorder: "Rahmen",
    shades: "Schattierungen",
    shadesHint: "mit Schwarz gemischt",
    tints: "Aufhellungen",
    tintsHint: "mit Weiß gemischt",
    tones: "Töne",
    tonesHint: "von Grau bis voll gesättigt",
    similar: "Ähnlich",
    similarHint: "benachbarte Farbtöne",
    variationsNote: "Wähle ein Farbfeld, um es zu kopieren, stattdessen zu verwenden oder zur Palette hinzuzufügen.",
    harmonies: {
      complementary: "Komplementär",
      analogous: "Analog",
      split: "Teilkomplementär",
      triadic: "Triadisch",
      tetradic: "Tetradisch",
      square: "Quadratisch",
      monochromatic: "Monochromatisch",
    },
    useAsPalette: "Als Palette verwenden",
    paletteReplaced: "Palette ersetzt",
    harmoniesNote: "Harmonien drehen den Farbton auf dem HSL-Farbkreis, wie es die meisten Farbwerkzeuge tun.",
    visionNote: "Links: die Farbe. Rechts: wie sie mit dieser Art des Farbsehens erscheint.",
    closestFamily: "Nächste Grundfarbe",
    families: {
      red: "Rot",
      orange: "Orange",
      yellow: "Gelb",
      green: "Grün",
      blue: "Blau",
      purple: "Violett",
      pink: "Rosa",
      brown: "Braun",
      black: "Schwarz",
      white: "Weiß",
      gray: "Grau",
    },
    meaningNote: (review) => (
      <>
        Was eine Farbe bedeutet, hängt von Kontext, Kultur und dem genauen Farbton ab. Die Aussagen unten beschreiben
        die Farbfamilie allgemein, und jede verweist auf ihre Quelle. Eine Übersichtsarbeit nennt das Forschungsfeld
        jung und rät zur Vorsicht bei der Anwendung ({review}).
      </>
    ),
    noMeaning: "Für diese Farbfamilie gibt es noch keine belegten Aussagen.",
    kinds: { study: "Studie", review: "Übersichtsarbeit", convention: "Konvention" },
  },

  exportDialog: {
    title: "Palette exportieren",
    description: "Kopiere den Code oder lade ihn als Datei herunter. Die Variablennamen entstehen aus den Farbnamen.",
    format: "Exportformat",
    previewAlt: "Vorschau des Palettenbilds",
    downloadPng: "PNG herunterladen",
    download: (filename) => `${filename} herunterladen`,
    copy: "Kopieren",
    copiedWhat: (format) => `${format}-Code`,
    imageFailed: "Das Bild konnte in diesem Browser nicht erstellt werden",
  },

  importDialog: {
    title: "Farben importieren",
    description: (max) =>
      `Füge Hex-Codes ein, getrennt durch Kommas, Leerzeichen oder Zeilenumbrüche (mit oder ohne #), außerdem CSS, Zeilen wie „name: #hex“ oder einen Paletten-Link von ${SITE_NAME} oder Coolors. Höchstens ${max} Farben.`,
    inputLabel: "Zu importierende Farben",
    needTwo: "Eine Palette braucht mindestens zwei Farben.",
    noneFound: "In diesem Text wurden keine Hex-Farben gefunden.",
    replace: "Aktuelle Palette ersetzen",
    imported: (colors) => `${colors} Farben importiert`,
  },

  library: {
    title: "Gespeicherte Paletten",
    description:
      "Nur in diesem Browser gespeichert. Um eine Palette woanders aufzubewahren, teile ihren Link oder exportiere sie.",
    namePlaceholder: "Name für die aktuelle Palette (optional)",
    nameLabel: "Name für die aktuelle Palette",
    save: "Aktuelle speichern",
    empty: "Noch keine gespeicherten Paletten.",
    untitled: "Unbenannte Palette",
    remove: (title) => `${title} löschen`,
    saved: "Palette in diesem Browser gespeichert",
    storageError: "Dieser Browser hat das Speichern nicht erlaubt (privater Modus oder Speicher voll)",
    loaded: (title) => `${title} geladen`,
    deleted: (title) => `${title} gelöscht`,
  },

  info: {
    kicker: "Das ist",
    start: "Mit deinen Farben starten",
    heading: "Barrierefreie Farbpaletten erstellen und Kontraste prüfen",
    intro: `Mit ${SITE_NAME} erstellst du eine Farbpalette und prüfst sie, bevor du sie einsetzt: Ist der Text lesbar, können Menschen mit Farbsehschwäche die Farben unterscheiden, und welche kleinste Änderung behebt ein Problem? Das Tool ist kostenlos und läuft vollständig in deinem Browser.`,
    featuresLabel: "Funktionen",
    features: [
      {
        title: "Palette erstellen und benennen",
        text: "Wähle Farben, sperre die, die dir gefallen, und generiere den Rest. Sortiere per Drag-and-drop um. Jede Farbe bekommt einen Namensvorschlag, den du überschreiben kannst.",
      },
      {
        title: "Textkontrast prüfen",
        text: "Sieh jede Farbe auf jeder anderen, mit WCAG-2-Verhältnis oder APCA-Wert, als Matrix oder als Karten.",
      },
      {
        title: "Farbsehschwächen simulieren",
        text: "Betrachte die Palette mit sieben Arten von Farbsehschwäche und finde die Paare, die schwer zu unterscheiden sind.",
      },
      {
        title: "Probleme in einem Schritt beheben",
        text: "Für ein Paar, das eine Kontraststufe knapp verfehlt oder bei Farbsehschwäche verschmilzt, bekommst du die kleinste Helligkeitsänderung, die das Problem löst.",
      },
      {
        title: "Einzelne Farbe untersuchen",
        text: "Rechne in HEX, RGB, HSL, HWB, CMYK, LAB, LCH, LUV, XYZ und OKLCH um und erkunde Schattierungen, Aufhellungen, Töne und Harmonien.",
      },
      {
        title: "Teilen und exportieren",
        text: "Die Palette steckt im Link, Teilen heißt also: Adresse kopieren. Exportiere CSS-Variablen, SCSS, Tailwind, JSON, Design Tokens, SVG oder PNG.",
      },
    ],
    questions: "Fragen",
    faq: {
      storage: {
        question: "Wird meine Palette auf einem Server gespeichert?",
        answer: `Nein. ${SITE_NAME} hat keinen Server und keine Konten. Die Palette steckt im Link, und gespeicherte Paletten bleiben im lokalen Speicher deines Browsers.`,
      },
      method: {
        question: "WCAG oder APCA?",
        answer: (wcag, apca) => (
          <>
            Vorschriften zur Barrierefreiheit beziehen sich auf WCAG 2 ({wcag}); nutze dieses Verhältnis, wenn du
            konform sein musst. {apca} ist ein neueres Verfahren, das berücksichtigt, welche Farbe der Text ist. Es ist
            nicht Teil von WCAG 2 und eignet sich am besten als zweite Meinung.
          </>
        ),
      },
      simulation: {
        question: "Wie genau ist die Simulation von Farbsehschwächen?",
        answer: (model) => (
          <>
            Sie folgt einem veröffentlichten Modell ({model}) und zeigt zuverlässig, welche Paare zu einer Farbe
            verschmelzen. Sie kann nicht zeigen, was ein einzelner Mensch sieht, und Bildschirme unterscheiden sich.
          </>
        ),
      },
      fix: {
        question: "Was ändert die Korrektur?",
        answer:
          "Nur die Helligkeit, im Farbraum OKLCH, um den kleinsten Betrag, der das Ziel erreicht. Farbton und Sättigung bleiben, die Farbe bleibt also wiedererkennbar.",
      },
    },
    footer: `${SITE_NAME} läuft in deinem Browser. Nichts, was du eingibst, wird irgendwohin gesendet.`,
  },
};
