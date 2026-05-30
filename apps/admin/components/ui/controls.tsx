"use client";

// Toolbar controls ported from admin-kit.jsx: SearchBox (debounce-free) +
// FilterTab. onChange passes the raw string value.
import { useState, type ReactNode } from "react";
import { T } from "@/lib/tokens";
import { Ic } from "@/components/icons";

export function SearchBox({
  value,
  onChange,
  placeholder = "Tìm kiếm",
  width = 300,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number;
  mono?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 13px",
        height: 40,
        width,
        borderRadius: 8,
        border: `1px solid ${focused ? T.ink : T.line2}`,
        background: focused ? T.paper : T.paper2,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <Ic.search size={16} stroke={T.ink3} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: T.ink, fontFamily: mono ? T.mono : T.sans, fontSize: 13.5, minWidth: 0 }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.ink4, padding: 0 }}>
          <Ic.close size={14} stroke="currentColor" />
        </button>
      )}
    </div>
  );
}

export function FilterTab({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        height: 40,
        borderRadius: 8,
        border: `1px solid ${active ? T.ink : T.line2}`,
        background: active ? T.ink : "transparent",
        color: active ? T.paper : T.ink2,
        fontFamily: T.sans,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >
      {children}
      {count != null && (
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 100, background: active ? "rgba(245,241,234,0.18)" : T.paper3, color: active ? T.paper : T.ink3 }}>
          {count}
        </span>
      )}
    </button>
  );
}
