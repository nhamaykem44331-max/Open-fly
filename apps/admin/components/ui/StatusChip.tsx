// Status pill (tone-colored). Ported from admin-kit.jsx.
import type { ReactNode } from "react";
import { T } from "@/lib/tokens";

type Tone = "green" | "amber" | "red" | "rust" | "neutral";

const MAP: Record<Tone, { fg: string; bg: string; bd: string }> = {
  green: { fg: T.green, bg: "var(--greenTint)", bd: "color-mix(in srgb, var(--green) 30%, transparent)" },
  amber: { fg: T.amber, bg: "color-mix(in srgb, var(--amber) 12%, transparent)", bd: "color-mix(in srgb, var(--amber) 32%, transparent)" },
  red: { fg: T.red, bg: "color-mix(in srgb, var(--red) 12%, transparent)", bd: "color-mix(in srgb, var(--red) 30%, transparent)" },
  rust: { fg: T.rust, bg: "var(--rustTint)", bd: "color-mix(in srgb, var(--rust) 30%, transparent)" },
  neutral: { fg: T.ink2, bg: "transparent", bd: T.line2 },
};

export function StatusChip({ tone = "neutral", children, dot = false, size = "md" }: { tone?: Tone; children: ReactNode; dot?: boolean; size?: "sm" | "md" }) {
  const m = MAP[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "3px 9px" : "5px 11px",
        borderRadius: 100,
        border: `1px solid ${m.bd}`,
        background: m.bg,
        color: m.fg,
        fontFamily: T.sans,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        letterSpacing: 0.1,
        whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.fg, flexShrink: 0 }} />}
      {children}
    </span>
  );
}
