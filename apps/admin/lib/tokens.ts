// OpenFly Admin — theme token map (CSS-variable references).
// Mirrors the design mockup's `C` (desktop-theme.js) and apps/web's `T`.
// Every value resolves to a CSS custom property defined in globals.css, so a
// single [data-theme] flip on <html> retints the whole app instantly.
export const T = {
  ink: "var(--ink)",
  ink2: "var(--ink2)",
  ink3: "var(--ink3)",
  ink4: "var(--ink4)",
  line: "var(--line)",
  line2: "var(--line2)",
  paper: "var(--paper)",
  paper2: "var(--paper2)",
  paper3: "var(--paper3)",
  canvas: "var(--canvas)",
  rust: "var(--rust)",
  rustLt: "var(--rustLt)",
  rustSoft: "var(--rustSoft)",
  rustTint: "var(--rustTint)",
  greenTint: "var(--greenTint)",
  onInk: "var(--onInk)", // text/paper on an Ink block (stays cream both themes)
  inkBlock: "var(--inkBlock)", // "Ink" surface for inverted cards (near-black both themes)
  tan: "var(--tan)",
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  serif: "var(--serif)",
  sans: "var(--sans)",
  mono: "var(--mono)",
} as const;

export type Tokens = typeof T;

// Format a full-VND integer with Vietnamese thousands separators (Q-45: prices
// are stored as full VND, e.g. 2592000 → "2.592.000đ"). Do NOT divide by 1000.
export function fmtVND(v: number): string {
  return `${Math.round(v).toLocaleString("vi-VN")}đ`;
}
