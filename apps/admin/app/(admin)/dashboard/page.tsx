"use client";

// Tổng quan — operational snapshot. Read-only stats from GET /admin/stats.
import { useRouter } from "next/navigation";
import Link from "next/link";
import { T } from "@/lib/tokens";
import { Ic, AIc } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/ui/StatCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { Countdown } from "@/components/ui/Countdown";
import { useDashboard, type DashboardStats } from "@/data/useDashboard";

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function vnToday(): { weekday: string; date: string } {
  const vn = new Date(Date.now() + 7 * 3600 * 1000);
  return {
    weekday: WEEKDAYS[vn.getUTCDay()],
    date: `${vn.getUTCDate()} thg ${vn.getUTCMonth() + 1}, ${vn.getUTCFullYear()}`,
  };
}

const fmtPlain = (v: number) => v.toLocaleString("vi-VN");

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useDashboard();
  const today = vnToday();

  return (
    <div className="of-anim">
      <PageHead
        eyebrow="Bảng điều khiển"
        title="Tổng quan hôm nay"
        subtitle="Trạng thái vận hành OpenFly theo thời gian thực. Ưu tiên xử lý vé sắp hết hạn giữ chỗ."
        actions={
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3 }}>{today.weekday}</div>
            <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, fontWeight: 500 }}>{today.date}</div>
          </div>
        }
      />

      {isError ? (
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", background: T.paper, fontFamily: T.sans, fontSize: 14, color: T.red }}>
          Không tải được tổng quan. Kiểm tra kết nối máy chủ rồi thử lại.
        </div>
      ) : isLoading || !data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(218px, 1fr))", gap: 16 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ minHeight: 132, borderRadius: 10, border: `1px solid ${T.line}`, background: T.paper2, opacity: 0.6 }} />
          ))}
        </div>
      ) : (
        <Loaded data={data} go={(href) => router.push(href)} />
      )}
    </div>
  );
}

function Loaded({ data, go }: { data: DashboardStats; go: (href: string) => void }) {
  const actions: { text: string; meta: string; tone: "red" | "amber" | "green"; href?: string }[] = [];
  if (data.pendingTickets > 0)
    actions.push({
      text: `${data.pendingTickets} vé chờ xuất`,
      meta: data.pendingTicketsUrgent > 0 ? `${data.pendingTicketsUrgent} sắp hết hạn giữ chỗ` : "Gửi PNR cho nhà cung cấp",
      tone: data.pendingTicketsUrgent > 0 ? "red" : "amber",
      href: "/queue",
    });
  if (data.issueFailed > 0)
    actions.push({ text: `${data.issueFailed} vé xuất lỗi`, meta: "Cần xử lý lại hoặc liên hệ khách", tone: "red", href: "/queue" });
  if (data.paymentsReview > 0)
    actions.push({ text: `${data.paymentsReview} thanh toán chờ duyệt`, meta: "Đối soát thủ công (Giai đoạn 3)", tone: "amber" });
  if (data.refundsOpen > 0)
    actions.push({ text: `${data.refundsOpen} yêu cầu refund / đổi vé`, meta: "CSKH theo dõi (Giai đoạn 3)", tone: "amber" });

  return (
    <>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(218px, 1fr))", gap: 16, marginBottom: 18 }}>
        <StatCard accent label="Vé chờ xuất" value={String(data.pendingTickets)} sub={`${data.pendingTicketsUrgent} sắp hết hạn giữ chỗ`} />
        <StatCard label="Doanh thu hôm nay" value={fmtPlain(data.revenueToday)} unit="đ" size={27} sub="đã thanh toán hôm nay" />
        <StatCard label="Booking hôm nay" value={String(data.bookingsToday)} sub="đơn đã tạo" />
        <StatCard label="Hunt đang chạy" value={String(data.huntsRunning)} sub="đang theo dõi giá" />
        <StatCard label="Session pool" value={String(data.sessionHealthy)} unit={`/ ${data.sessionTotal}`} sub="phiên khỏe">
          <div style={{ marginTop: 11, display: "flex", gap: 3 }}>
            {Array.from({ length: Math.max(data.sessionTotal, 1) }).map((_, i) => (
              <span key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: i < data.sessionHealthy ? T.green : T.red }} />
            ))}
          </div>
        </StatCard>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        {/* Cần xử lý ngay */}
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "17px 22px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AIc.alert size={17} stroke={T.rust} />
              <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: "-0.4px" }}>Cần xử lý ngay</span>
            </div>
            <StatusChip tone="rust" size="sm">{actions.length} mục</StatusChip>
          </div>
          {actions.length === 0 ? (
            <div style={{ padding: "32px 22px", fontFamily: T.sans, fontSize: 13.5, color: T.ink3, textAlign: "center" }}>Mọi thứ đang ổn — không có việc gấp.</div>
          ) : (
            actions.map((u, i) => {
              const clickable = !!u.href;
              const inner = (
                <>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", flexShrink: 0, background: u.tone === "red" ? T.red : u.tone === "amber" ? T.amber : T.green }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: 0.1 }}>{u.text}</span>
                    <span style={{ display: "block", fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 3 }}>{u.meta}</span>
                  </span>
                  {clickable && <Ic.chevron size={16} stroke={T.ink4} />}
                </>
              );
              const baseStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                textAlign: "left",
                padding: "15px 22px",
                background: "transparent",
                border: "none",
                borderBottom: i < actions.length - 1 ? `1px solid ${T.line}` : "none",
              };
              return clickable ? (
                <button key={i} onClick={() => go(u.href!)} style={{ ...baseStyle, cursor: "pointer" }}>{inner}</button>
              ) : (
                <div key={i} style={{ ...baseStyle, cursor: "default" }}>{inner}</div>
              );
            })
          )}
        </div>

        {/* Sắp hết hạn giữ chỗ */}
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "17px 22px", borderBottom: `1px solid ${T.line}` }}>
            <Ic.clock size={17} stroke={T.ink2} />
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, letterSpacing: "-0.4px" }}>Sắp hết hạn giữ chỗ</span>
          </div>
          {data.soonExpiring.length === 0 ? (
            <div style={{ padding: "32px 22px", fontFamily: T.sans, fontSize: 13.5, color: T.ink3, textAlign: "center" }}>Không có vé nào sắp hết hạn.</div>
          ) : (
            data.soonExpiring.map((b, i) => (
              <Link
                key={b.id}
                href="/queue"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: i < data.soonExpiring.length - 1 ? `1px solid ${T.line}` : "none", cursor: "pointer" }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{b.route.replace("-", " → ")}</span>
                    {b.airline && <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>· {b.airline}</span>}
                  </span>
                  <span style={{ display: "block", fontFamily: T.mono, fontSize: 11.5, color: T.ink3, marginTop: 3 }}>
                    {b.orderCode}
                    {b.pnr.length ? ` · PNR ${b.pnr.join(", ")}` : ""}
                  </span>
                </span>
                {b.holdExpiresAt && <Countdown expiry={new Date(b.holdExpiresAt).getTime()} />}
              </Link>
            ))
          )}
          <Link href="/queue" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderTop: `1px solid ${T.line}`, fontFamily: T.serif, fontSize: 14.5, fontWeight: 500, color: T.rust }}>
            Mở hàng đợi xuất vé <Ic.arrow size={16} stroke="currentColor" />
          </Link>
        </div>
      </div>
    </>
  );
}
