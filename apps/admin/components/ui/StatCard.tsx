// Stat card (label + big serif value + optional unit/sub/children). Ported from
// admin-kit.jsx.
import type { ReactNode } from "react";
import { T } from "@/lib/tokens";

export function StatCard({
  label,
  value,
  unit,
  sub,
  accent,
  children,
  size = 38,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: boolean;
  children?: ReactNode;
  size?: number;
}) {
  return (
    <div
      style={{
        background: T.paper,
        border: `1px solid ${accent ? T.ink : T.line}`,
        borderRadius: 10,
        padding: "20px 22px 18px",
        display: "flex",
        flexDirection: "column",
        minHeight: 132,
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: T.ink3 }}>{label}</span>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontFamily: T.serif, fontSize: size, fontWeight: 500, color: accent ? T.rust : T.ink, letterSpacing: "-1px", lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ fontFamily: T.serif, fontSize: Math.round(size * 0.5), fontWeight: 500, color: T.ink3 }}>{unit}</span>}
        </div>
        {children}
        {sub && <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 9, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );
}
