// Suggested T-shirt size from the five sizing dimensions.
// Mirrors the source spreadsheet IFS():
//   sum=0 → ""; <6 → XS; <=10 → S; <=15 → M; <=20 → L; <=23 → XL; else XXL
import type { Sizing, TShirtSize } from "../types";

export const SIZING_DIMENSIONS: { key: keyof Sizing; label: string }[] = [
  { key: "scope", label: "Scope Score" },
  { key: "technicalComplexity", label: "Technical Complexity" },
  { key: "dependencies", label: "Dependencies" },
  { key: "archImpact", label: "Arch Impact Assessment" },
  { key: "risk", label: "Risk and Unknowns" },
];

export const T_SHIRT_SIZES: TShirtSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

/** Sum of the five 1..5 dimension scores. */
export function sizingScoreSum(s: Sizing): number {
  return (
    s.scope + s.technicalComplexity + s.dependencies + s.archImpact + s.risk
  );
}

/** Suggested T-shirt size, or "" when nothing is scored yet. */
export function suggestedTShirtSize(s: Sizing): TShirtSize {
  const sum = sizingScoreSum(s);
  if (sum === 0) return "";
  if (sum < 6) return "XS";
  if (sum <= 10) return "S";
  if (sum <= 15) return "M";
  if (sum <= 20) return "L";
  if (sum <= 23) return "XL";
  return "XXL";
}

/** Green→red colour band for a single 1..5 score cell. */
export function scoreClass(score: number): string {
  if (score <= 0) return "score-none";
  if (score <= 2) return "score-low"; // green
  if (score <= 3) return "score-mid"; // yellow
  if (score <= 4) return "score-high"; // orange
  return "score-max"; // red
}
