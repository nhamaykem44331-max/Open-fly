"use client";

// OpenFly Admin — topbar: global search + theme toggle + notifications + user
// menu. Ported from the design mockup (admin-shell.jsx). Theme toggle is live;
// search/notifications/user identity/logout are placeholders wired when auth +
// lookup land (P1.2 / P2). No fabricated counts.
import { useState, type CSSProperties } from "react";
import { T } from "@/lib/tokens";
import { Ic } from "@/components/icons";
import { useTheme } from "@/lib/useTheme";

function menuItemStyle(): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 11,
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 7,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: T.sans,
    fontSize: 13.5,
    fontWeight: 500,
    color: T.ink2,
  };
}

export function Topbar() {
  const { theme, toggle, mounted } = useTheme();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);

  return (
    <header
      style={{
        height: 66,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "color-mix(in srgb, var(--canvas) 86%, transparent)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.line}`,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 28px",
      }}
    >
      {/* Global search — wired to booking lookup in P2 */}
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 460, height: 40, padding: "0 14px", borderRadius: 9, border: `1px solid ${T.line2}`, background: T.paper }}
      >
        <Ic.search size={17} stroke={T.ink3} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm orderCode, PNR, SĐT, email…"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: T.ink, fontFamily: T.sans, fontSize: 13.5, minWidth: 0 }}
        />
        <kbd style={{ fontFamily: T.mono, fontSize: 11, color: T.ink4, border: `1px solid ${T.line2}`, borderRadius: 5, padding: "2px 6px", background: T.paper2 }}>⌘K</kbd>
      </form>

      <div style={{ flex: 1 }} />

      <button
        onClick={toggle}
        title="Đổi giao diện"
        style={{ width: 40, height: 40, borderRadius: 9, border: `1px solid ${T.line2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.ink2 }}
      >
        {mounted ? (
          theme === "dark" ? <Ic.sun size={18} /> : <Ic.moon size={18} />
        ) : (
          <span style={{ width: 18, height: 18 }} />
        )}
      </button>

      <button
        title="Thông báo"
        style={{ width: 40, height: 40, borderRadius: 9, border: `1px solid ${T.line2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.ink2 }}
      >
        <Ic.bell size={18} />
      </button>

      <div style={{ width: 1, height: 28, background: T.line2 }} />

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setMenu((m) => !m)}
          style={{ display: "flex", alignItems: "center", gap: 11, padding: "5px 8px 5px 5px", borderRadius: 100, border: `1px solid ${menu ? T.ink : T.line2}`, background: "transparent", cursor: "pointer" }}
        >
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: T.ink, color: T.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontSize: 14, fontStyle: "italic", fontWeight: 600, flexShrink: 0 }}>OF</span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
            <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink }}>Quản trị viên</span>
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>OpenFly</span>
          </span>
          <span style={{ display: "flex", transform: menu ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
            <Ic.down size={15} stroke={T.ink3} />
          </span>
        </button>
        {menu && (
          <>
            <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 240, background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 11, zIndex: 71, overflow: "hidden", boxShadow: "0 20px 50px -20px rgba(20,17,16,0.4)", animation: "modalIn 0.16s ease both" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.line}` }}>
                <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>Quản trị viên</div>
                <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink3, marginTop: 3 }}>—</div>
              </div>
              <div style={{ padding: 6 }}>
                {([["Hồ sơ cá nhân", Ic.user], ["Cài đặt", Ic.settings]] as const).map(([lbl, Icon], i) => (
                  <button key={i} onClick={() => setMenu(false)} style={menuItemStyle()}>
                    <Icon size={16} stroke={T.ink3} /> {lbl}
                  </button>
                ))}
                <div style={{ height: 1, background: T.line, margin: "6px 8px" }} />
                <button onClick={() => setMenu(false)} style={{ ...menuItemStyle(), color: T.red }}>
                  <Ic.logout size={16} /> Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
