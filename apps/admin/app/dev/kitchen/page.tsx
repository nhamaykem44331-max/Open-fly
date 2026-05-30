"use client";

// Design-system showcase (dev-only) — xác minh fonts (Fraunces/Inter/JetBrains
// Mono), tiếng Việt đủ dấu, token màu, và dark mode flip. Sẽ lớn dần khi port
// thêm primitives từ admin-kit.jsx.
import { useEffect, useState } from "react";
import { T, fmtVND } from "@/lib/tokens";

const SWATCHES: { name: string; var: string }[] = [
  { name: "ink", var: "--ink" },
  { name: "ink2", var: "--ink2" },
  { name: "ink3", var: "--ink3" },
  { name: "ink4", var: "--ink4" },
  { name: "paper", var: "--paper" },
  { name: "paper2", var: "--paper2" },
  { name: "paper3", var: "--paper3" },
  { name: "canvas", var: "--canvas" },
  { name: "rust", var: "--rust" },
  { name: "rustLt", var: "--rustLt" },
  { name: "rustSoft", var: "--rustSoft" },
  { name: "tan", var: "--tan" },
  { name: "green", var: "--green" },
  { name: "amber", var: "--amber" },
  { name: "red", var: "--red" },
  { name: "inkBlock", var: "--inkBlock" },
];

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("openfly-admin-theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };
  return [theme, toggle];
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: T.ink3,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

export default function KitchenPage() {
  const [theme, toggle] = useTheme();
  return (
    <div style={{ minHeight: "100vh", padding: "48px 56px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: T.rust }}>
            OpenFly · Bảng quản trị
          </div>
          <h1 style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 500, color: T.ink, margin: "8px 0 0", letterSpacing: -0.5 }}>
            Hệ thống thiết kế
          </h1>
        </div>
        <button
          onClick={toggle}
          style={{
            fontFamily: T.sans,
            fontSize: 13,
            fontWeight: 600,
            color: T.ink,
            background: T.paper,
            border: `1px solid ${T.line2}`,
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? "☀ Sáng" : "☾ Tối"}
        </button>
      </div>

      {/* Typography — kiểm tra tiếng Việt đủ dấu trên cả 3 font */}
      <section style={{ marginBottom: 48 }}>
        <Label>Kiểu chữ</Label>
        <p style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, color: T.ink, margin: "0 0 6px" }}>
          Fraunces — Đặt vé máy bay khắp Việt Nam
        </p>
        <p style={{ fontFamily: T.sans, fontSize: 16, fontWeight: 400, color: T.ink2, margin: "0 0 6px" }}>
          Inter — Hành khách: Nguyễn Thị Hồng Nhung đã thanh toán đủ, chờ xuất vé.
        </p>
        <p style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 500, color: T.ink, margin: 0, letterSpacing: 0.5 }}>
          JetBrains Mono — PNR OFY8K2 · {fmtVND(2592000)}
        </p>
      </section>

      {/* Color tokens */}
      <section style={{ marginBottom: 48 }}>
        <Label>Bảng màu (token)</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
          {SWATCHES.map((s) => (
            <div key={s.name} style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden", background: T.paper }}>
              <div style={{ height: 56, background: `var(${s.var})` }} />
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 500, color: T.ink }}>{s.name}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink3 }}>{s.var}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Status pills — preview tone xanh/vàng/đỏ/rust */}
      <section>
        <Label>Trạng thái</Label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { t: "Đã xuất vé", fg: T.green, bg: "var(--greenTint)", bd: "color-mix(in srgb, var(--green) 30%, transparent)" },
            { t: "Chờ xuất", fg: T.amber, bg: "color-mix(in srgb, var(--amber) 12%, transparent)", bd: "color-mix(in srgb, var(--amber) 32%, transparent)" },
            { t: "Quá hạn giữ chỗ", fg: T.red, bg: "color-mix(in srgb, var(--red) 12%, transparent)", bd: "color-mix(in srgb, var(--red) 30%, transparent)" },
            { t: "Cần duyệt", fg: T.rust, bg: "var(--rustTint)", bd: "color-mix(in srgb, var(--rust) 30%, transparent)" },
          ].map((p) => (
            <span
              key={p.t}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 11px",
                borderRadius: 100,
                border: `1px solid ${p.bd}`,
                background: p.bg,
                color: p.fg,
                fontFamily: T.sans,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.fg }} />
              {p.t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
