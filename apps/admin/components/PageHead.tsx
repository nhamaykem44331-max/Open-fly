// OpenFly Admin — page header (eyebrow + serif title + optional subtitle/actions).
import { T } from "@/lib/tokens";

export function PageHead({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
      <div>
        {eyebrow && (
          <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase", color: T.rust, marginBottom: 8 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, margin: 0, letterSpacing: -0.4, lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: T.sans, fontSize: 14, color: T.ink3, margin: "8px 0 0", maxWidth: 620, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
