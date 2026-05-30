// OpenFly — typed design tokens.
// Each value is a CSS var() reference, so components read tokens with plain
// inline styles (e.g. `style={{ color: T.ink }}`) and theming happens entirely
// through the [data-theme] flip on <html> — no React re-render needed.

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
  // onInk: text/icon on an Ink block — stays cream in BOTH themes.
  onInk: "var(--onInk)",
  // inkBlock: an "always dark" surface (voucher card, boarding pass) — stays near-black in BOTH themes.
  inkBlock: "var(--inkBlock)",
  tan: "var(--tan)",
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  serif: "'Fraunces Variable', Georgia, serif",
  sans: "'Inter Variable', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, monospace",
} as const;

export type Tokens = typeof T;

/** Currency symbol shown after a written-out VND amount.
 *  Swap to "VND" or "₫" here if preferred — it is used everywhere via this constant. */
export const CURRENCY = "đ";

/** Prices in mock data are stored in thousands of VND ("k"): the value 890 means 890.000đ.
 *  fmtVnd writes that value out in FULL đồng with Vietnamese thousands separators:
 *    fmtVnd(890)  → "890.000"     (hiển thị: 890.000đ)
 *    fmtVnd(1450) → "1.450.000"   (hiển thị: 1.450.000đ)
 *    fmtVnd(2592) → "2.592.000"   (hiển thị: 2.592.000đ)
 *  When the real API is wired it sends full VND (Q-45) — divide by 1000 at that boundary
 *  to keep feeding these k-based components, or pass full VND straight to a fmt helper then. */
export const fmtVnd = (k: number): string => Math.round(k * 1000).toLocaleString("vi-VN").replace(/,/g, ".");

/** Compact price for the DENSE price-heat calendar only (7 columns don't fit full VND on a
 *  360px phone). Input is k-units (thousands of VND): < 1tr → "890K", ≥ 1tr → "1,18tr".
 *  Q-?? (chốt 2026-05-30): calendar dùng dạng gọn; mọi giá giao dịch khác vẫn full VND (fmtVnd). */
export const fmtCalPrice = (k: number): string =>
  k < 1000 ? `${k}K` : `${(k / 1000).toFixed(2).replace(".", ",")}tr`;
