"use client";

// Copy-able mono code chip (PNR, orderCode). Ported from admin-kit.jsx.
import { useState } from "react";
import { T } from "@/lib/tokens";
import { Ic, AIc } from "@/components/icons";
import { toast } from "@/lib/toast";

export function CopyCode({ value, label, size = 13 }: { value: string; label?: string; size?: number }) {
  const [done, setDone] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const t = document.createElement("textarea");
      t.value = value;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(t);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1300);
    toast(`Đã copy ${label || "mã"} ${value}`, "neutral");
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "3px 8px 3px 10px",
        borderRadius: 6,
        border: `1px solid ${T.line2}`,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: size, fontWeight: 500, color: T.ink, letterSpacing: 0.5 }}>{value}</span>
      {done ? <Ic.check size={13} stroke={T.green} /> : <AIc.copy size={13} stroke={T.ink3} />}
    </button>
  );
}
