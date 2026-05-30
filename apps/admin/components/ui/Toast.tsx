"use client";

import { useToastStore } from "@/lib/toast";
import { T } from "@/lib/tokens";

const TONE: Record<string, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  rust: "var(--rust)",
  neutral: "var(--ink)",
};

export function ToastHost() {
  const items = useToastStore((s) => s.items);
  return (
    <div style={{ position: "fixed", bottom: 26, right: 26, zIndex: 400, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 18px",
            minWidth: 240,
            maxWidth: 380,
            background: T.inkBlock,
            borderRadius: 10,
            border: "1px solid rgba(245,241,234,0.12)",
            animation: "toastIn 0.25s cubic-bezier(0.22,0.61,0.36,1) both",
            boxShadow: "0 20px 50px -20px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: TONE[it.tone], flexShrink: 0 }} />
          <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.onInk, lineHeight: 1.4 }}>{it.msg}</span>
        </div>
      ))}
    </div>
  );
}
