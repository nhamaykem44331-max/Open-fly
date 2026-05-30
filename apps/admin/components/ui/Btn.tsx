// Button primitive ported from the design mockup (desktop-ui.jsx).
import type { CSSProperties, ReactNode } from "react";
import { T } from "@/lib/tokens";

type Variant = "primary" | "rust" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  full,
  disabled,
  type = "button",
  style = {},
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}) {
  const pad = size === "lg" ? "16px 30px" : size === "sm" ? "9px 16px" : "13px 24px";
  const fs = size === "lg" ? 16 : size === "sm" ? 13 : 15;
  const base: Record<Variant, CSSProperties> = {
    primary: { background: T.ink, color: T.paper, border: "1px solid transparent" },
    rust: { background: T.rust, color: "#F5F1EA", border: "1px solid transparent" },
    secondary: { background: "transparent", color: T.ink, border: `1px solid ${T.ink}` },
    ghost: { background: "transparent", color: T.ink2, border: `1px solid ${T.line2}` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base[variant],
        padding: pad,
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: T.serif,
        fontSize: fs,
        fontWeight: 500,
        letterSpacing: "-0.2px",
        display: full ? "flex" : "inline-flex",
        width: full ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        transition: "all 0.15s",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
