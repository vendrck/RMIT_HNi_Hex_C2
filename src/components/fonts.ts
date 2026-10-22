import { Atkinson_Hyperlegible_Next, Source_Serif_4 } from "next/font/google";

// Interface: Atkinson Hyperlegible, a face designed for legibility (fits exam access needs).
// Paper text: Source Serif 4, so an opened exam reads like a printed paper.
export const uiFont = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  adjustFontFallback: false, // next/font has no fallback metrics for this family yet
});
export const paperFont = Source_Serif_4({ subsets: ["latin"], variable: "--font-paper", display: "swap" });
