"use client";

// Tra cứu booking — search by orderCode/PNR/phone/email + detail drawer
// (timeline, passengers, payment, price breakdown).
import { useEffect, useState } from "react";
import { T, fmtVND } from "@/lib/tokens";
import { Ic } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { Btn } from "@/components/ui/Btn";
import { StatusChip } from "@/components/ui/StatusChip";
import { CopyCode } from "@/components/ui/CopyCode";
import { SearchBox, FilterTab } from "@/components/ui/controls";
import { bookingStatus, type ChipTone } from "@/lib/bookingStatus";
import { useLookupSearch, useBookingDetail, type LookupRow, type BookingDetail } from "@/data/useLookup";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "TICKETED", label: "Đã xuất vé" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "REFUNDED", label: "Đã hoàn" },
];

const EVENT_TONE: Record<string, ChipTone> = {
  TICKETED: "green",
  PAID: "rust",
  HELD: "amber",
  PAYMENT_PENDING: "amber",
  ISSUE_FAILED: "red",
  FAILED: "red",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  REFUNDED: "amber",
  CREATED: "rust",
};
const TONE_COLOR: Record<ChipTone, string> = { green: T.green, amber: T.amber, red: T.red, rust: T.rust, neutral: T.ink4 };

function vnDateTime(iso: string | null): string {
  if (!iso) return "—";
  const vn = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  const hh = String(vn.getUTCHours()).padStart(2, "0");
  const mm = String(vn.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} · ${vn.getUTCDate()}/${vn.getUTCMonth() + 1}/${vn.getUTCFullYear()}`;
}
function vnDate(iso: string | null): string {
  if (!iso) return "—";
  const vn = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return `${vn.getUTCDate()}/${vn.getUTCMonth() + 1}/${vn.getUTCFullYear()}`;
}

export default function LookupPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError } = useLookupSearch(debouncedQ, status);
  const rows = data?.items ?? [];

  const columns: Column<LookupRow>[] = [
    {
      key: "order",
      label: "Mã đơn",
      width: 150,
      render: (b) => (
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 12.5, fontWeight: 500, color: T.ink }}>{b.orderCode}</div>
          {b.pnr.length > 0 && <div style={{ fontFamily: T.mono, fontSize: 11, color: T.ink3, marginTop: 3 }}>PNR {b.pnr.join(", ")}</div>}
        </div>
      ),
    },
    {
      key: "route",
      label: "Hành trình",
      render: (b) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, color: T.ink, letterSpacing: "-0.3px" }}>{b.route.replace("-", " → ")}</span>
            <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3 }}>{[b.airline, b.flightNumber].filter(Boolean).join(" ")}</span>
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 3 }}>{vnDateTime(b.departTime)}</div>
        </div>
      ),
    },
    {
      key: "user",
      label: "Khách",
      render: (b) => (
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 500, color: T.ink2 }}>{b.userName ?? "—"}</div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{b.userPhone ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: 140,
      render: (b) => {
        const s = bookingStatus(b.status);
        return (
          <StatusChip tone={s.tone} dot size="sm">{s.label}</StatusChip>
        );
      },
    },
    {
      key: "total",
      label: "Tổng tiền",
      align: "right",
      width: 130,
      sortable: true,
      sortVal: (b) => b.total,
      render: (b) => <span style={{ fontFamily: T.serif, fontSize: 15.5, fontWeight: 500, color: T.ink, letterSpacing: "-0.3px" }}>{fmtVND(b.total)}</span>,
    },
    { key: "go", label: "", align: "right", width: 44, render: () => <Ic.chevron size={17} stroke={T.ink4} /> },
  ];

  return (
    <div className="of-anim">
      <PageHead
        eyebrow="Vận hành vé"
        title="Tra cứu booking"
        subtitle="Tìm theo orderCode, PNR, số điện thoại hoặc email. Mở chi tiết để xem timeline, hành khách, thanh toán và phân tách giá."
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <FilterTab key={f.key} active={status === f.key} onClick={() => setStatus(f.key)}>{f.label}</FilterTab>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <SearchBox value={q} onChange={setQ} placeholder="orderCode, PNR, SĐT, email…" width={320} />
      </div>

      {isError ? (
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", background: T.paper, fontFamily: T.sans, fontSize: 14, color: T.red }}>
          Không tải được kết quả. Kiểm tra kết nối máy chủ rồi thử lại.
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          rowKey={(b) => b.id}
          onRowClick={(b) => setActiveId(b.id)}
          empty={debouncedQ ? `Không tìm thấy booking cho “${debouncedQ}”.` : "Nhập từ khoá để tra cứu, hoặc xem các đơn gần đây."}
        />
      )}

      <BookingDetailDrawer id={activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase", color: T.ink3, marginBottom: 13, display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: 16, height: 1, background: T.rust }} />
      {children}
    </div>
  );
}

function PriceRow({ label, value, accent, strong, neg }: { label: string; value: number; accent?: boolean; strong?: boolean; neg?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0" }}>
      <span style={{ fontFamily: T.sans, fontSize: strong ? 13.5 : 13, fontWeight: strong ? 600 : 500, color: strong ? T.ink : T.ink2 }}>{label}</span>
      <span style={{ fontFamily: strong ? T.serif : T.sans, fontSize: strong ? 18 : 13.5, fontWeight: 500, color: neg ? T.green : strong ? T.ink : accent ? T.rust : T.ink2, letterSpacing: strong ? "-0.3px" : 0 }}>
        {neg ? "−" : ""}
        {fmtVND(Math.abs(value))}
      </span>
    </div>
  );
}

function BookingDetailDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: d, isLoading, isError } = useBookingDetail(id);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      eyebrow={d ? `Đơn ${d.orderCode}` : "Chi tiết đơn"}
      title={d ? `${d.from} → ${d.to}` : "Đang tải…"}
      width={560}
      footer={<Btn variant="ghost" size="sm" onClick={onClose}>Đóng</Btn>}
    >
      {isLoading || (!d && !isError) ? (
        <div style={{ padding: "40px 0", textAlign: "center", fontFamily: T.sans, fontSize: 13.5, color: T.ink3 }}>Đang tải chi tiết…</div>
      ) : isError || !d ? (
        <div style={{ padding: "40px 0", textAlign: "center", fontFamily: T.sans, fontSize: 13.5, color: T.red }}>Không tải được chi tiết đơn.</div>
      ) : (
        <Detail d={d} />
      )}
    </Drawer>
  );
}

function Detail({ d }: { d: BookingDetail }) {
  const st = bookingStatus(d.status);
  const ticketByPnr = d.pnrs.find((p) => p.ticketNumber)?.ticketNumber;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatusChip tone={st.tone} dot>{st.label}</StatusChip>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>
          {d.airline && <span style={{ width: 22, height: 22, borderRadius: 5, background: T.paper3, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.ink2 }}>{d.airline}</span>}
          {[d.flightNumber, d.cabin].filter(Boolean).join(" · ")}
        </span>
        <div style={{ flex: 1 }} />
        {d.pnrs.length > 0 && <CopyCode value={d.pnrs.map((p) => p.pnr).join(", ")} label="PNR" />}
      </div>

      {/* Route */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 17px", borderRadius: 10, background: T.paper2, border: `1px solid ${T.line}`, marginBottom: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: "-0.5px" }}>{d.from}</div>
          <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{vnDateTime(d.departTime)}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, margin: "5px 0" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.ink4 }} />
            <span style={{ flex: 1, height: 1, background: T.line2 }} />
            <Ic.plane2 size={15} stroke={T.rust} />
            <span style={{ flex: 1, height: 1, background: T.line2 }} />
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.ink4 }} />
          </div>
          {d.duration && <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink4 }}>{d.duration}</div>}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: "-0.5px" }}>{d.to}</div>
          <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{vnDateTime(d.arriveTime)}</div>
        </div>
      </div>

      {/* Timeline */}
      {d.timeline.length > 0 && (
        <>
          <SectionTitle>Tiến trình đơn</SectionTitle>
          <div style={{ marginBottom: 26 }}>
            {d.timeline.map((ev, i) => {
              const tone = EVENT_TONE[ev.eventType] ?? "rust";
              const last = i === d.timeline.length - 1;
              return (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ width: 13, height: 13, borderRadius: "50%", background: TONE_COLOR[tone], boxShadow: `0 0 0 3px color-mix(in srgb, ${TONE_COLOR[tone]} 18%, transparent)` }} />
                    {!last && <span style={{ width: 2, flex: 1, minHeight: 30, background: T.line2, marginTop: 2 }} />}
                  </div>
                  <div style={{ paddingBottom: last ? 0 : 16, flex: 1 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{ev.title}</div>
                    <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 3 }}>{vnDateTime(ev.occurredAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Passengers */}
      <SectionTitle>Hành khách ({d.passengers.length})</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
        {d.passengers.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 15px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.paper }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: T.paper3, color: T.ink2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
              {(p.fullName.trim().split(/\s+/).pop() || "?")[0]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{p.fullName}</div>
              <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>
                {[p.isChild ? "Trẻ em" : "Người lớn", p.gender, p.dob ? vnDate(p.dob) : null].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        ))}
        {d.passengers.length === 0 && <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink4 }}>Chưa có thông tin hành khách.</div>}
      </div>

      {/* Price */}
      <SectionTitle>Phân tách giá</SectionTitle>
      <div style={{ padding: "6px 16px 14px", borderRadius: 10, border: `1px solid ${T.line}`, background: T.paper, marginBottom: 20 }}>
        <PriceRow label="Giá nhập (net)" value={d.price.net} />
        <PriceRow label="Markup OpenFly" value={d.price.markup} accent />
        {d.price.tax > 0 && <PriceRow label="Thuế" value={d.price.tax} />}
        {d.price.fee > 0 && <PriceRow label="Phí dịch vụ" value={d.price.fee} />}
        {d.price.addons > 0 && <PriceRow label="Add-on" value={d.price.addons} />}
        {d.price.voucherDiscount > 0 && <PriceRow label={`Voucher${d.price.voucherCode ? ` ${d.price.voucherCode}` : ""}`} value={d.price.voucherDiscount} neg />}
        <div style={{ height: 1, background: T.line, margin: "6px 0" }} />
        <PriceRow label="Tổng khách trả" value={d.price.total} strong />
      </div>

      {/* Payment */}
      <SectionTitle>Thanh toán</SectionTitle>
      {d.payments.length === 0 ? (
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink4 }}>Chưa có giao dịch thanh toán.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.line}`, background: T.line }}>
          {(() => {
            const pay = d.payments[0];
            const cells: [string, string, boolean?][] = [
              ["Phương thức", pay.provider, false],
              ["Mã giao dịch", pay.transactionRef ?? "—", true],
              ["Thời điểm", vnDateTime(pay.paidAt), false],
              ["Số tiền", fmtVND(pay.amount), false],
            ];
            return cells.map(([k, v, mono], i) => (
              <div key={i} style={{ background: T.paper, padding: "12px 15px" }}>
                <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: T.ink3, marginBottom: 5 }}>{k}</div>
                <div style={{ fontFamily: mono ? T.mono : T.sans, fontSize: 13, fontWeight: 500, color: T.ink2, wordBreak: "break-all" }}>{v}</div>
              </div>
            ));
          })()}
        </div>
      )}
    </>
  );
}
