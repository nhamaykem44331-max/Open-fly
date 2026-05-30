"use client";

// ⭐ Hàng đợi xuất vé (Booking Ops Queue) — Q-51 manual ticketing.
// Nhân viên gửi PNR + hành trình vào nhóm Zalo Nam Thanh, sau khi NCC xuất vé
// thì nhập số vé theo PNR và đánh dấu đã xuất. Đếm ngược hạn giữ chỗ.
import { useEffect, useState } from "react";
import { T, fmtVND } from "@/lib/tokens";
import { Ic, AIc } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Countdown } from "@/components/ui/Countdown";
import { CopyCode } from "@/components/ui/CopyCode";
import { Modal } from "@/components/ui/Modal";
import { Btn } from "@/components/ui/Btn";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SearchBox, FilterTab } from "@/components/ui/controls";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/client";
import { useQueue, useMarkTicketed, useMarkIssueFailed, type QueueRow } from "@/data/useQueue";

const URGENT_MS = 30 * 60 * 1000;

function zaloMessage(b: QueueRow): string {
  const parts = [
    "[OpenFly] Nhờ xuất vé",
    `Đơn: ${b.orderCode}`,
    `Chặng: ${b.from} → ${b.to}${b.airline ? ` · ${b.airline}` : ""}${b.departLabel ? ` · bay ${b.departLabel}` : ""}`,
    `PNR: ${b.pnrs.join(", ") || "—"}`,
    `Số tiền: ${fmtVND(b.amount)}`,
  ];
  return parts.join("\n");
}

export default function QueuePage() {
  const { data: rows = [], isLoading, isError } = useQueue();
  const [filter, setFilter] = useState<"all" | "urgent" | "multi">("all");
  const [q, setQ] = useState("");
  const [issuing, setIssuing] = useState<QueueRow | null>(null);
  const [failing, setFailing] = useState<QueueRow | null>(null);

  const now = Date.now();
  const isUrgent = (b: QueueRow) => b.holdExpiresAt != null && b.holdExpiresAt - now < URGENT_MS;
  const urgentCount = rows.filter(isUrgent).length;
  const totalVnd = rows.reduce((s, b) => s + b.amount, 0);

  const filtered = rows.filter((b) => {
    if (q) {
      const hay = `${b.orderCode} ${b.pnrs.join(" ")} ${b.from} ${b.to}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (filter === "urgent") return isUrgent(b);
    if (filter === "multi") return b.pnrs.length > 1;
    return true;
  });

  const copyZalo = (b: QueueRow) => {
    navigator.clipboard?.writeText(zaloMessage(b)).catch(() => {});
    toast(`Đã copy nội dung gửi Zalo · ${b.orderCode}`, "neutral");
  };

  const columns: Column<QueueRow>[] = [
    {
      key: "hold",
      label: "Hạn giữ",
      width: 150,
      sortable: true,
      sortVal: (b) => b.holdExpiresAt ?? Number.MAX_SAFE_INTEGER,
      render: (b) => {
        if (b.holdExpiresAt == null) return <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink4 }}>—</span>;
        const remain = Math.max(0, b.holdExpiresAt - Date.now());
        const pct = b.holdWindowMs ? Math.max(4, Math.min(100, (remain / b.holdWindowMs) * 100)) : null;
        const barColor = remain < 10 * 60000 ? T.red : remain < URGENT_MS ? T.amber : T.green;
        return (
          <div>
            <Countdown expiry={b.holdExpiresAt} size={14} />
            {pct != null && (
              <div style={{ height: 4, borderRadius: 3, background: T.paper3, marginTop: 8, overflow: "hidden", maxWidth: 110 }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: barColor }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "order",
      label: "Mã đơn · Hành trình",
      sortable: true,
      sortVal: (b) => b.from,
      wrap: true,
      render: (b) => (
        <div style={{ minWidth: 210 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: "-0.3px" }}>
              {b.from} <span style={{ color: T.ink4 }}>→</span> {b.to}
            </span>
            {b.airline && (
              <span style={{ width: 22, height: 18, borderRadius: 4, background: T.paper3, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, color: T.ink2 }}>{b.airline}</span>
            )}
          </div>
          {b.departLabel && <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 4 }}>Bay {b.departLabel}</div>}
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink4, marginTop: 4 }}>
            {b.orderCode}
            {b.paidLabel ? ` · TT ${b.paidLabel}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "pnr",
      label: "PNR → Zalo",
      width: 180,
      render: (b) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          {b.pnrs.length === 0 ? (
            <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink4 }}>Chưa có PNR</span>
          ) : (
            b.pnrs.map((p) => <CopyCode key={p} value={p} label="PNR" />)
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyZalo(b);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, color: T.rust }}
          >
            <AIc.send2 size={13} stroke="currentColor" /> Copy gửi Zalo
          </button>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Số tiền",
      align: "right",
      width: 130,
      sortable: true,
      sortVal: (b) => b.amount,
      render: (b) => <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: "-0.4px", whiteSpace: "nowrap" }}>{fmtVND(b.amount)}</span>,
    },
    {
      key: "act",
      label: "",
      align: "right",
      width: 200,
      render: (b) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIssuing(b);
            }}
            disabled={b.pnrs.length === 0}
            title={b.pnrs.length === 0 ? "Chưa có PNR để xuất" : undefined}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: 7,
              background: T.rust,
              color: "#F5F1EA",
              border: "1px solid transparent",
              cursor: b.pnrs.length === 0 ? "not-allowed" : "pointer",
              fontFamily: T.serif,
              fontSize: 13.5,
              fontWeight: 500,
              whiteSpace: "nowrap",
              opacity: b.pnrs.length === 0 ? 0.5 : 1,
            }}
          >
            <Ic.check size={15} stroke="currentColor" /> Đã xuất vé
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFailing(b);
            }}
            title="Báo xuất vé thất bại"
            style={{ width: 36, height: 36, borderRadius: 7, border: `1px solid ${T.line2}`, background: "transparent", color: T.ink3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <AIc.alert size={16} stroke="currentColor" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="of-anim">
      <PageHead
        eyebrow="Vận hành vé"
        title="Hàng đợi xuất vé"
        subtitle="Vé đã thanh toán đang chờ xuất. Gửi PNR vào nhóm Zalo nhà cung cấp (Nam Thanh), xuất xong thì đánh dấu và nhập số vé. Ưu tiên đơn sắp hết hạn giữ chỗ."
        actions={
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 100, border: `1px solid ${T.line2}`, background: T.paper }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: "pulseDot 1.6s ease-in-out infinite" }} />
            <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3 }}>Tự cập nhật mỗi giây</span>
          </div>
        }
      />

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 0, marginBottom: 22, border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden", background: T.paper, flexWrap: "wrap" }}>
        {[
          { l: "Chờ xuất vé", v: String(rows.length), accent: false, wide: false },
          { l: "Sắp hết hạn (<30 phút)", v: String(urgentCount), accent: true, wide: false },
          { l: "Tổng giá trị chờ xuất", v: fmtVND(totalVnd), accent: false, wide: true },
        ].map((s, i) => (
          <div key={i} style={{ flex: s.wide ? "1.4" : "1", minWidth: 170, padding: "16px 22px", borderLeft: i ? `1px solid ${T.line}` : "none" }}>
            <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: T.ink3, marginBottom: 9 }}>{s.l}</div>
            <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, letterSpacing: "-0.8px", color: s.accent ? T.red : T.ink }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} count={rows.length}>Tất cả</FilterTab>
          <FilterTab active={filter === "urgent"} onClick={() => setFilter("urgent")} count={urgentCount}>Gấp</FilterTab>
          <FilterTab active={filter === "multi"} onClick={() => setFilter("multi")}>Nhiều PNR</FilterTab>
        </div>
        <div style={{ flex: 1 }} />
        <SearchBox value={q} onChange={setQ} placeholder="Tìm orderCode, PNR, chặng…" width={280} />
      </div>

      {isError ? (
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", background: T.paper, fontFamily: T.sans, fontSize: 14, color: T.red }}>
          Không tải được hàng đợi. Kiểm tra kết nối máy chủ rồi thử lại.
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={isLoading}
          rowKey={(b) => b.id}
          empty={q || filter !== "all" ? "Không có đơn khớp bộ lọc." : "Tuyệt — không còn vé nào chờ xuất."}
        />
      )}

      <IssueModal row={issuing} onClose={() => setIssuing(null)} />
      <FailModal row={failing} onClose={() => setFailing(null)} />
    </div>
  );
}

function BookingSummary({ row }: { row: QueueRow }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 15px", borderRadius: 9, background: T.paper2, border: `1px solid ${T.line}`, marginBottom: 18 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink, letterSpacing: "-0.3px" }}>
          {row.from} → {row.to}
          {row.airline ? ` · ${row.airline}` : ""}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.ink3, marginTop: 4 }}>
          {row.orderCode} · PNR {row.pnrs.join(", ") || "—"}
          {row.departLabel ? ` · ${row.departLabel}` : ""}
        </div>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>{fmtVND(row.amount)}</div>
    </div>
  );
}

function IssueModal({ row, onClose }: { row: QueueRow | null; onClose: () => void }) {
  const mark = useMarkTicketed();
  const [tickets, setTickets] = useState<string[]>([]);
  useEffect(() => {
    if (row) setTickets(row.pnrs.map(() => ""));
  }, [row]);
  if (!row) return null;

  const filled = tickets.filter((t) => t.trim()).length;
  const ready = row.pnrs.length > 0 && filled === row.pnrs.length;

  const submit = () => {
    if (!ready || mark.isPending) return;
    mark.mutate(
      { id: row.id, ticketNumbers: row.pnrs.map((pnr, i) => ({ pnr, ticketNumber: tickets[i].trim() })) },
      {
        onSuccess: () => {
          toast(`Đã xuất vé ${row.orderCode} · lưu ${filled} số vé`, "green");
          onClose();
        },
        onError: (e) => toast(e instanceof ApiError ? e.message : "Lỗi khi đánh dấu xuất vé", "red"),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Xác nhận xuất vé"
      title="Đánh dấu đã xuất vé"
      width={520}
      footer={
        <>
          <Btn variant="ghost" size="sm" onClick={onClose}>Hủy</Btn>
          <button
            onClick={submit}
            disabled={!ready || mark.isPending}
            style={{
              padding: "11px 22px",
              borderRadius: 7,
              border: "1px solid transparent",
              cursor: ready && !mark.isPending ? "pointer" : "not-allowed",
              background: ready ? T.rust : T.paper3,
              color: ready ? "#F5F1EA" : T.ink4,
              fontFamily: T.serif,
              fontSize: 14,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: ready && !mark.isPending ? 1 : 0.7,
            }}
          >
            <Ic.check size={16} stroke="currentColor" /> {mark.isPending ? "Đang lưu…" : "Xác nhận đã xuất"}
          </button>
        </>
      }
    >
      <BookingSummary row={row} />
      <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginBottom: 14, lineHeight: 1.5 }}>
        Nhập số vé do nhà cung cấp trả về cho từng PNR.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {row.pnrs.map((pnr, i) => (
          <Field key={pnr} label={`Số vé · PNR ${pnr}`} required>
            <Input mono value={tickets[i] ?? ""} placeholder="VD: 738-2401234567" onChange={(e) => setTickets((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} />
          </Field>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ready ? T.green : T.amber }} />
        Đã nhập {filled}/{row.pnrs.length} số vé
      </div>
    </Modal>
  );
}

const FAIL_REASONS = ["NCC không phản hồi", "Hết chỗ tại nhà cung cấp", "Sai thông tin hành khách", "Giá đã thay đổi"];

function FailModal({ row, onClose }: { row: QueueRow | null; onClose: () => void }) {
  const mark = useMarkIssueFailed();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (row) setReason("");
  }, [row]);
  if (!row) return null;

  const ready = reason.trim().length > 0;
  const submit = () => {
    if (!ready || mark.isPending) return;
    mark.mutate(
      { id: row.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast(`Đã ghi nhận xuất vé thất bại · ${row.orderCode}`, "amber");
          onClose();
        },
        onError: (e) => toast(e instanceof ApiError ? e.message : "Lỗi khi ghi nhận", "red"),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Báo xuất vé thất bại"
      title="Ghi nhận xuất vé thất bại"
      width={520}
      footer={
        <>
          <Btn variant="ghost" size="sm" onClick={onClose}>Hủy</Btn>
          <button
            onClick={submit}
            disabled={!ready || mark.isPending}
            style={{
              padding: "11px 22px",
              borderRadius: 7,
              cursor: ready && !mark.isPending ? "pointer" : "not-allowed",
              background: "transparent",
              color: ready ? T.red : T.ink4,
              border: `1px solid ${ready ? T.red : T.line2}`,
              fontFamily: T.serif,
              fontSize: 14,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: ready && !mark.isPending ? 1 : 0.7,
            }}
          >
            <AIc.alert size={15} stroke="currentColor" /> {mark.isPending ? "Đang gửi…" : "Gửi báo cáo"}
          </button>
        </>
      }
    >
      <BookingSummary row={row} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: T.ink3, marginBottom: 9 }}>Lý do nhanh</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FAIL_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                padding: "7px 13px",
                borderRadius: 100,
                cursor: "pointer",
                border: `1px solid ${reason === r ? T.ink : T.line2}`,
                background: reason === r ? T.ink : "transparent",
                color: reason === r ? T.paper : T.ink2,
                fontFamily: T.sans,
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <Field label="Chi tiết lý do" required>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mô tả ngắn gọn vì sao không xuất được vé…" rows={3} />
      </Field>
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, padding: "11px 13px", borderRadius: 8, background: "color-mix(in srgb, var(--amber) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--amber) 28%, transparent)" }}>
        <AIc.alert size={15} stroke={T.amber} />
        <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>
          Đơn sẽ chuyển sang trạng thái <b>cần xử lý</b> để CSKH liên hệ khách.
        </span>
      </div>
    </Modal>
  );
}
