"use client";

// Generic data table: sortable columns, optional pagination, loading skeleton,
// empty state. Ported from admin-kit.jsx.
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { T } from "@/lib/tokens";
import { Ic, AIc } from "@/components/icons";

export interface Column<R> {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: number;
  sortable?: boolean;
  sortVal?: (row: R) => string | number;
  wrap?: boolean;
  render?: (row: R, hover: boolean) => ReactNode;
}

export function DataTable<R>({
  columns,
  rows,
  pageSize = 0,
  onRowClick,
  empty = "Không có dữ liệu.",
  loading = false,
  rowKey,
}: {
  columns: Column<R>[];
  rows: R[];
  pageSize?: number;
  onRowClick?: (row: R) => void;
  empty?: string;
  loading?: boolean;
  rowKey: (row: R) => string;
}) {
  const [sort, setSort] = useState<{ key: string | null; dir: "asc" | "desc" }>({ key: null, dir: "asc" });
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortVal) return rows;
    const acc = col.sortVal;
    return [...rows].sort((a, b) => {
      const x = acc(a);
      const y = acc(b);
      if (x < y) return sort.dir === "asc" ? -1 : 1;
      if (x > y) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort, columns]);

  const pages = pageSize ? Math.ceil(sorted.length / pageSize) : 1;
  const view = pageSize ? sorted.slice(page * pageSize, page * pageSize + pageSize) : sorted;

  const clickSort = (col: Column<R>) => {
    if (!col.sortable) return;
    setSort((s) =>
      s.key === col.key ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: col.key, dir: "asc" },
    );
  };

  return (
    <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.line}` }}>
              {columns.map((col) => {
                const on = sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => clickSort(col)}
                    style={{
                      textAlign: col.align || "left",
                      padding: "13px 18px",
                      fontFamily: T.sans,
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: 1.4,
                      textTransform: "uppercase",
                      color: on ? T.ink : T.ink3,
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      width: col.width,
                      background: T.paper2,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, justifyContent: col.align === "right" ? "flex-end" : "flex-start" }}>
                      {col.label}
                      {col.sortable &&
                        (on ? (
                          sort.dir === "asc" ? <AIc.sortUp size={13} stroke={T.rust} /> : <AIc.sortDown size={13} stroke={T.rust} />
                        ) : (
                          <AIc.sort size={12} stroke={T.ink4} />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={"sk" + i} style={{ borderBottom: `1px solid ${T.line}` }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "16px 18px" }}>
                      <div style={{ height: 12, borderRadius: 4, background: T.paper3, width: `${40 + ((i * 7 + col.key.length * 5) % 50)}%`, opacity: 0.7 }} />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && view.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: "54px 18px", textAlign: "center" }}>
                  <div style={{ fontFamily: T.serif, fontSize: 16, color: T.ink3, fontStyle: "italic" }}>{empty}</div>
                </td>
              </tr>
            )}
            {!loading && view.map((row) => <TableRow key={rowKey(row)} row={row} columns={columns} onRowClick={onRowClick} />)}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && sorted.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: `1px solid ${T.line}` }}>
          <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3 }}>
            {page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} trên {sorted.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <PageBtn disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <Ic.back size={16} stroke="currentColor" />
            </PageBtn>
            <PageBtn disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
              <Ic.fwd size={16} stroke="currentColor" />
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        border: `1px solid ${T.line2}`,
        background: "transparent",
        color: disabled ? T.ink4 : T.ink2,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function TableRow<R>({ row, columns, onRowClick }: { row: R; columns: Column<R>[]; onRowClick?: (row: R) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      style={{ borderBottom: `1px solid ${T.line}`, cursor: onRowClick ? "pointer" : "default", background: hover ? T.paper2 : "transparent", transition: "background 0.12s" }}
    >
      {columns.map((col) => {
        const cellStyle: CSSProperties = {
          padding: "14px 18px",
          textAlign: col.align || "left",
          verticalAlign: "middle",
          whiteSpace: col.wrap ? "normal" : "nowrap",
        };
        return (
          <td key={col.key} style={cellStyle}>
            {col.render ? col.render(row, hover) : <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{String((row as Record<string, unknown>)[col.key] ?? "")}</span>}
          </td>
        );
      })}
    </tr>
  );
}
