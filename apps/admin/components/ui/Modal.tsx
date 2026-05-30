"use client";

// Centered modal (fade + scale), Esc / overlay-click to close. Ported from
// admin-kit.jsx.
import { useEffect } from "react";
import { T } from "@/lib/tokens";
import { Ic } from "@/components/icons";

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 480,
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(20,17,16,0.52)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "overlayIn 0.18s ease both",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: T.paper,
          border: `1px solid ${T.line2}`,
          borderRadius: 12,
          animation: "modalIn 0.18s cubic-bezier(0.22,0.61,0.36,1) both",
          boxShadow: "0 30px 80px -30px rgba(20,17,16,0.55)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 24px 16px", borderBottom: `1px solid ${T.line}` }}>
          <div>
            {eyebrow && <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: T.ink3, marginBottom: 8 }}>{eyebrow}</div>}
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: "-0.6px", color: T.ink, lineHeight: 1.2 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.line2}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: T.ink2 }}>
            <Ic.close size={16} stroke="currentColor" />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: `1px solid ${T.line}` }}>{footer}</div>}
      </div>
    </div>
  );
}
