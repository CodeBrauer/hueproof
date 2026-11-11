import { Cal_Sans, Fira_Sans } from "next/font/google";

// The tool uses two typefaces and no more.

/** Headlines, the wordmark and hex codes. Cal Sans comes in a single weight. */
export const displayFont = Cal_Sans({ variable: "--font-cal-sans", weight: "400", subsets: ["latin", "latin-ext"] });
/** Everything else. Numbers are set in its tabular figures instead of a separate monospaced font. */
export const textFont = Fira_Sans({
  variable: "--font-fira-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});
