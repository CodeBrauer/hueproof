import type { Dictionary } from "@/i18n/dictionaries";
import { LOGO_CHECK_PATH, LOGO_CHECK_WIDTH, LOGO_RING_WIDTH, logoArcs } from "@/lib/palette-image";

/** The role colors of the palette, plus the label colors that read best on primary and accent. */
export interface VisualColors {
  background: string;
  surface: string;
  text: string;
  primary: string;
  accent: string;
  onPrimary: string;
  onAccent: string;
  /** Every palette color, in order. */
  all: string[];
}

interface VisualProps {
  colors: VisualColors;
  texts: Dictionary["preview"];
}

const VIEW_BOX = "0 0 480 300";
const DISPLAY = { fontFamily: "var(--font-cal-sans)" };
const BODY = { fontFamily: "var(--font-fira-sans)" };
/** Bar heights as a share of the chart height, repeated as needed; fixed so the chart does not jump. */
const BAR_HEIGHTS = [0.62, 0.88, 0.46, 0.74, 1, 0.56, 0.8, 0.42, 0.68, 0.92];
const TILE = 60;
const TILE_COLUMNS = 8;
const TILE_ROWS = 5;

function Mark({ colors, ink, x, y, scale }: { colors: string[]; ink: string; x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none">
      {logoArcs(colors.length).map((path, index) => (
        <path key={index} d={path} stroke={colors[index]} strokeWidth={LOGO_RING_WIDTH} />
      ))}
      <path d={LOGO_CHECK_PATH} stroke={ink} strokeWidth={LOGO_CHECK_WIDTH} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Front and back of a business card on the surface color, drawn flat. */
export function BusinessCardVisual({ colors, texts }: VisualProps) {
  const { background, surface, text, primary, accent, onPrimary, all } = colors;
  return (
    <svg viewBox={VIEW_BOX} role="img" aria-label={texts.visuals.card} className="block w-full">
      <rect width="480" height="300" fill={surface} />
      <g transform="rotate(-8 240 150)">
        <rect x="64" y="38" width="300" height="180" rx="18" fill={primary} />
        {/* Top left, where the card in front does not cover it. */}
        <text x="86" y="76" fontSize="26" fill={onPrimary} style={DISPLAY}>
          {texts.cardStudio}
        </text>
      </g>
      <g transform="rotate(4 240 150)">
        <rect x="112" y="88" width="300" height="180" rx="18" fill={background} stroke={text} strokeOpacity="0.25" />
        <Mark colors={all} ink={text} x={132} y={104} scale={1.3} />
        <rect x="350" y="112" width="40" height="16" rx="8" fill={accent} />
        <text x="134" y="190" fontSize="25" fill={text} style={DISPLAY}>
          {texts.cardName}
        </text>
        <text x="134" y="211" fontSize="13" fontWeight="600" fill={primary} style={BODY}>
          {texts.cardRole}
        </text>
        <text x="134" y="244" fontSize="11" fill={text} fillOpacity="0.75" style={BODY}>
          hello@studio.example
        </text>
        {all.map((hex, index) => (
          <circle key={index} cx={390 - index * 15} cy={240} r="5.5" fill={hex} stroke={text} strokeOpacity="0.2" />
        ))}
      </g>
    </svg>
  );
}

/** A title slide with a small chart that uses every palette color. */
export function SlideVisual({ colors, texts }: VisualProps) {
  const { background, surface, text, primary, accent, onPrimary, onAccent, all } = colors;
  const kickerWidth = texts.slideKicker.length * 6.9 + 26;
  const chart = { x: 288, width: 140, base: 214, height: 128, gap: 6 };
  const barWidth = (chart.width - chart.gap * (all.length - 1)) / all.length;
  return (
    <svg viewBox={VIEW_BOX} role="img" aria-label={texts.visuals.slide} className="block w-full">
      <rect width="480" height="300" fill={background} />
      <rect x="36" y="42" width={kickerWidth} height="22" rx="11" fill={accent} />
      <text
        x={36 + kickerWidth / 2}
        y="57"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="0.06em"
        fill={onAccent}
        style={BODY}
      >
        {texts.slideKicker.toUpperCase()}
      </text>
      {texts.slideTitle.map((line, index) => (
        <text key={line} x="36" y={112 + index * 32} fontSize="29" fill={text} style={DISPLAY}>
          {line}
        </text>
      ))}
      <text x="36" y="176" fontSize="12.5" fill={text} fillOpacity="0.8" style={BODY}>
        {texts.slideText}
      </text>
      <rect x="36" y="198" width="104" height="30" rx="15" fill={primary} />
      <text x="88" y="218.5" textAnchor="middle" fontSize="15" fill={onPrimary} style={DISPLAY}>
        {texts.cardStudio}
      </text>

      <rect x="270" y="42" width="176" height="196" rx="20" fill={surface} />
      {all.map((hex, index) => {
        const height = chart.height * BAR_HEIGHTS[index % BAR_HEIGHTS.length];
        return (
          <rect
            key={index}
            x={chart.x + index * (barWidth + chart.gap)}
            y={chart.base - height}
            width={barWidth}
            height={height}
            rx={Math.min(6, barWidth / 2)}
            fill={hex}
            stroke={text}
            strokeOpacity="0.2"
          />
        );
      })}
      <line x1="286" y1="220" x2="430" y2="220" stroke={text} strokeOpacity="0.5" strokeWidth="1.5" />

      <line x1="36" y1="262" x2="444" y2="262" stroke={text} strokeOpacity="0.2" />
      <text x="36" y="281" fontSize="10" fill={text} fillOpacity="0.7" style={BODY}>
        01
      </text>
      <Mark colors={all} ink={text} x={424} y={267} scale={0.62} />
    </svg>
  );
}

/** The shape inside a pattern tile, drawn from the tile's top-left corner. */
function TileShape({ kind, fill }: { kind: number; fill: string }) {
  switch (kind) {
    case 0:
      return <path d="M0 0h60a60 60 0 0 1-60 60z" fill={fill} />;
    case 1:
      return <path d="M0 0a30 30 0 0 0 60 0z" fill={fill} />;
    case 2:
      return <circle cx="30" cy="30" r="20" fill={fill} />;
    case 3:
      return <path d="M0 0h30a30 30 0 0 1-30 30zM60 60h-30a30 30 0 0 1 30-30z" fill={fill} />;
    default:
      return <path d="M0 0h60L0 60z" fill={fill} />;
  }
}

/** A geometric tile pattern from all palette colors. The arrangement is fixed, so it only changes with the colors. */
export function PatternVisual({ colors, texts }: VisualProps) {
  const { all } = colors;
  const tiles = Array.from({ length: TILE_COLUMNS * TILE_ROWS }, (_, index) => {
    const column = index % TILE_COLUMNS;
    const row = Math.floor(index / TILE_COLUMNS);
    const ground = (column + row * 2) % all.length;
    const candidate = (column * 3 + row + 1) % all.length;
    // A shape in the color of its own tile would be invisible.
    const figure = candidate === ground ? (candidate + 1) % all.length : candidate;
    return {
      x: column * TILE,
      y: row * TILE,
      ground: all[ground],
      figure: all[figure],
      kind: (column * 2 + row * 3 + column * row) % 5,
      turn: ((column + row * 3) % 4) * 90,
    };
  });
  return (
    <svg viewBox={VIEW_BOX} role="img" aria-label={texts.visuals.pattern} className="block w-full">
      {tiles.map((tile) => (
        <g key={`${tile.x}-${tile.y}`} transform={`translate(${tile.x} ${tile.y})`}>
          <rect width={TILE} height={TILE} fill={tile.ground} />
          <g transform={`rotate(${tile.turn} 30 30)`}>
            <TileShape kind={tile.kind} fill={tile.figure} />
          </g>
        </g>
      ))}
    </svg>
  );
}
