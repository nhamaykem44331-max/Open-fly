"use client";

// Right slide-in drawer (Esc / overlay-click to close). Ported from admin-kit.jsx.
import { useEffect } from "react";
import { T } from "@/lib/tokens";
import { Ic } from "@/components/icons";

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 540,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,17,16,0.5)", display: "flex", justifyContent: "flex-end", animation: "overlayIn 0.18s ease both" }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          height: "100%",
          background: T.paper,
          borderLeft: `1px solid ${T.line2}`,
          display: "flex",
          flexDirection: "column",
          animation: "drawerIn 0.22s cubic-bezier(0.22,0.61,0.36,1) both",
          boxShadow: "-30px 0 80px -30px rgba(20,17,16,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 26px 18px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: T.ink3, marginBottom: 8 }}>{eyebrow}</div>}
            <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 500, letterSpacing: "-0.8px", color: T.ink, lineHeight: 1.15 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.line2}`, borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: T.ink2 }}>
            <Ic.close size={17} stroke="currentColor" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 26px" }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "18px 26px", borderTop: `1px solid ${T.line}` }}>{footer}</div>}
      </div>
    </div>
  );
}
