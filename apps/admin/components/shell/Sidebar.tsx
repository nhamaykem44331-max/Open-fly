"use client";

// OpenFly Admin — sidebar: grouped nav, collapsible (persisted), active route.
// Ported from the design mockup (admin-shell.jsx). Routes not yet built show a
// phase tag (GĐ2/3/4) and are disabled until their screen lands.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/lib/tokens";
import { Ic, AIc, Sunmark, type IconProps } from "@/components/icons";

type NavItem = {
  id: string;
  label: string;
  icon: (p: IconProps) => React.ReactElement;
  star?: boolean;
  ready?: boolean; // built + navigable; otherwise disabled with phase tag
  phase?: number;
};

const NAV_GROUPS: { header: string | null; items: NavItem[] }[] = [
  { header: null, items: [{ id: "dashboard", label: "Tổng quan", icon: AIc.grid, ready: true }] },
  {
    header: "Vận hành vé",
    items: [
      { id: "queue", label: "Hàng đợi xuất vé", icon: Ic.ticket, star: true, ready: true },
      { id: "lookup", label: "Tra cứu booking", icon: Ic.search, ready: true },
      { id: "refunds", label: "Refund / Đổi vé", icon: AIc.refresh, phase: 3 },
      { id: "vat", label: "Hàng đợi VAT", icon: AIc.receipt, phase: 3 },
      { id: "payments", label: "Duyệt thanh toán", icon: AIc.bank, phase: 3 },
    ],
  },
  {
    header: "Khách & giá",
    items: [
      { id: "users", label: "Người dùng", icon: AIc.users, phase: 2 },
      { id: "markup", label: "Markup rules", icon: AIc.sliders, phase: 3 },
      { id: "vouchers", label: "Voucher", icon: Ic.gift, phase: 3 },
    ],
  },
  {
    header: "Hệ thống",
    items: [
      { id: "sessions", label: "Muadi session pool", icon: AIc.cpu, phase: 2 },
      { id: "hunts", label: "Fare hunts", icon: Ic.radar, phase: 4 },
      { id: "audit", label: "Audit log", icon: AIc.history, phase: 4 },
    ],
  },
  {
    header: "Sol AI",
    items: [
      { id: "aiconfig", label: "AI Config", icon: Ic.spark, phase: 4 },
      { id: "cost", label: "Cost dashboard", icon: Ic.trend, phase: 4 },
    ],
  },
];

const COLLAPSE_KEY = "openfly-admin-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const W = collapsed ? 68 : 248;

  return (
    <aside
      style={{
        width: W,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: T.paper,
        borderRight: `1px solid ${T.line}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: 66,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? 0 : "0 22px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid ${T.line}`,
          flexShrink: 0,
        }}
      >
        <Link
          href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
        >
          <Sunmark size={collapsed ? 30 : 27} color={T.rust} />
          {!collapsed && (
            <span style={{ fontFamily: T.serif, fontSize: 20, letterSpacing: "-1px", color: T.ink, fontWeight: 300, lineHeight: 1 }}>
              Open<span style={{ color: T.rust, fontWeight: 600 }}>Fly</span>
            </span>
          )}
        </Link>
      </div>

      {!collapsed && (
        <div style={{ padding: "14px 22px 8px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 100, border: `1px solid ${T.line2}`, background: T.paper2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
            <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: T.ink3 }}>Bảng quản trị</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "10px 12px" : "8px 14px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_GROUPS.map((grp, gi) => (
          <div key={gi} style={{ marginTop: gi === 0 ? 0 : 16 }}>
            {grp.header && !collapsed && (
              <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase", color: T.ink4, padding: "6px 12px 8px" }}>{grp.header}</div>
            )}
            {grp.header && collapsed && gi > 0 && <div style={{ height: 1, background: T.line, margin: "10px 8px" }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {grp.items.map((it) => (
                <NavRow key={it.id} item={it} active={pathname === `/${it.id}`} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: collapsed ? 12 : "12px 14px", borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <button
          onClick={toggleCollapsed}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "9px 0" : "9px 12px",
            borderRadius: 8,
            border: `1px solid ${T.line2}`,
            background: "transparent",
            cursor: "pointer",
            color: T.ink3,
          }}
        >
          <span style={{ display: "flex", transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <Ic.back size={17} />
          </span>
          {!collapsed && <span style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500 }}>Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}

function NavRow({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const inner = (
    <>
      {active && !collapsed && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: T.rust }} />}
      <span style={{ display: "flex", color: active ? T.rust : T.ink3, flexShrink: 0, opacity: item.ready ? 1 : 0.55 }}>
        <Icon size={collapsed ? 20 : 18} sw={active ? 1.8 : 1.5} />
      </span>
      {!collapsed && (
        <span style={{ flex: 1, fontFamily: T.sans, fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? T.ink : item.ready ? T.ink2 : T.ink4, letterSpacing: 0.1, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7 }}>
          {item.star && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.rustSoft, flexShrink: 0 }} />}
          {item.label}
        </span>
      )}
      {!collapsed && !item.ready && item.phase != null && (
        <span style={{ fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 100, background: T.paper2, color: T.ink4, border: `1px solid ${T.line2}` }}>
          GĐ{item.phase}
        </span>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: collapsed ? "10px 0" : "9px 12px",
    justifyContent: collapsed ? "center" : "flex-start",
    borderRadius: 8,
    width: "100%",
    textAlign: "left",
    background: active ? T.paper3 : "transparent",
  };

  if (!item.ready) {
    return (
      <div title={collapsed ? `${item.label} · Giai đoạn ${item.phase}` : undefined} style={{ ...baseStyle, cursor: "not-allowed" }} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/${item.id}`}
      title={collapsed ? item.label : undefined}
      style={{ ...baseStyle, cursor: "pointer", transition: "background 0.13s" }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = T.paper2;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {inner}
    </Link>
  );
}
