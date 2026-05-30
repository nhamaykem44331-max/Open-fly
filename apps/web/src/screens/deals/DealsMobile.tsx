// OpenFly — Deals & Vouchers (mobile), ported from screens-deals.jsx.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Price, Sunmark, Ic } from '../../components/ui'
import type { MyVoucher, FlashDeal } from '../../data/mock'
import type { DealsData } from '../../data/useDeals'

const TONE: Record<MyVoucher['tone'], string> = { ink: T.ink, rust: T.rust, ink2: T.ink2, ink4: T.ink4 }

function VoucherTicket({ v }: { v: MyVoucher }) {
  const isDark = v.tone === 'ink'
  const bg = isDark ? T.inkBlock : T.paper
  const fg = isDark ? T.onInk : T.ink
  return (
    <div style={{ background: bg, color: fg, borderRadius: 8, border: `1px solid ${isDark ? T.inkBlock : T.line}`, display: 'flex', alignItems: 'stretch', overflow: 'hidden', opacity: v.used ? 0.5 : 1, position: 'relative' }}>
      <div style={{ width: 8, background: TONE[v.tone], opacity: isDark ? 0.6 : 1 }} />
      <div style={{ flex: 1, padding: '16px 18px 16px 16px' }}>
        <Eyebrow dash={false} color={isDark ? T.rustSoft : T.ink3} style={{ marginBottom: 6 }}>{v.used ? 'Đã sử dụng' : 'Khả dụng'}</Eyebrow>
        <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: fg, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{v.title}</div>
        <div style={{ fontFamily: T.serif, fontSize: 12, color: isDark ? 'rgba(245,241,234,0.65)' : T.ink3, marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>{v.sub}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${isDark ? 'rgba(245,241,234,0.18)' : T.line2}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: isDark ? T.rustSoft : T.rust, letterSpacing: 1, fontWeight: 500 }}>{v.code}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: T.sans, fontSize: 10, color: isDark ? 'rgba(245,241,234,0.5)' : T.ink3 }}>HSD {v.expires}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 8, top: -8, width: 16, height: 16, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line}` }} />
      <div style={{ position: 'absolute', left: 8, bottom: -8, width: 16, height: 16, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line}` }} />
    </div>
  )
}

function FlashDealCard({ d, onTap }: { d: FlashDeal; onTap: () => void }) {
  return (
    <div onClick={onTap} style={{ minWidth: 184, marginRight: 12, flexShrink: 0, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ height: 96, background: T.paper2, position: 'relative', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'flex-end', padding: 14 }}>
        <div style={{ position: 'absolute', right: -22, top: -22, width: 90, height: 90, borderRadius: '50%', background: d.hue, opacity: 0.14 }} />
        <div style={{ position: 'absolute', right: 12, top: 10, padding: '2px 8px', borderRadius: 100, background: T.inkBlock, fontFamily: T.sans, fontSize: 9, fontWeight: 600, color: T.rustSoft, letterSpacing: 0.6, textTransform: 'uppercase' }}>{d.ends}</div>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 9, color: T.ink3, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{d.from} → {d.to}</div>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.7px', lineHeight: 1 }}>{d.city}</div>
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 9.5, color: T.ink3, letterSpacing: 0.5 }}>{d.badge}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3 }}>Từ</span>
            <Price value={d.price} size={18} />
          </div>
        </div>
        <Ic.arrow size={14} stroke={T.ink2} />
      </div>
    </div>
  )
}

function EarnRow({ icon, title, sub, value }: { icon: ReactNode; title: string; sub: string; value: string }) {
  return (
    <div style={{ padding: '14px 18px', borderRadius: 6, background: T.paper, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink, letterSpacing: '-0.2px' }}>{title}</div>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.rust, letterSpacing: '-0.2px' }}>{value}</div>
    </div>
  )
}

export function DealsMobile({ data }: { data: DealsData }) {
  const navigate = useNavigate()
  const { vouchers, flash } = data
  const available = vouchers.filter((v) => !v.used).length
  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={16} stroke={T.ink} /></button>
          <Eyebrow dash={false}>Ưu đãi</Eyebrow>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 400, letterSpacing: '-1.1px', lineHeight: 1.05, color: T.ink, margin: '18px 0 6px' }}>
          Mã ưu đãi <em style={{ color: T.rust, fontWeight: 500 }}>của bạn</em>
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', margin: '0 0 22px', lineHeight: 1.5, maxWidth: 320 }}>
          Mã sẽ tự áp dụng tại bước xác nhận booking — không cần nhập tay.
        </p>
      </div>

      {/* Membership card */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: T.inkBlock, color: T.onInk, borderRadius: 8, padding: '20px 22px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -36, top: -36, width: 140, height: 140, borderRadius: '50%', border: `1px solid ${T.rust}`, opacity: 0.4 }} />
          <div style={{ position: 'absolute', right: -16, top: -16, width: 100, height: 100, borderRadius: '50%', border: `1px solid ${T.rust}`, opacity: 0.25 }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 8 }}>Hạng thành viên</Eyebrow>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, color: T.onInk, letterSpacing: '-0.8px', lineHeight: 1 }}><em style={{ color: T.rustSoft, fontStyle: 'italic' }}>Premium</em></div>
              <div style={{ fontFamily: T.serif, fontSize: 12, color: 'rgba(245,241,234,0.7)', fontStyle: 'italic', marginTop: 6 }}>4.250 dặm bay · đến cuối 2026</div>
            </div>
            <Sunmark size={28} color={T.rustLt} />
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(245,241,234,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: T.sans, fontSize: 10, color: 'rgba(245,241,234,0.7)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Còn 1.750 dặm lên Elite</span>
              <span style={{ fontFamily: T.sans, fontSize: 10, color: T.rustSoft, fontWeight: 600 }}>70%</span>
            </div>
            <div style={{ height: 4, borderRadius: 100, background: 'rgba(245,241,234,0.12)', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: T.rust, borderRadius: 100 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Vouchers */}
      <div style={{ padding: '0 20px' }}>
        <Eyebrow>{available} mã đang khả dụng</Eyebrow>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vouchers.map((v) => <VoucherTicket key={v.code} v={v} />)}
        </div>
      </div>

      {/* Flash deals — no backend in Phase 1; hidden in API mode (flash is []). */}
      {flash.length > 0 && (
      <div style={{ padding: '28px 0 0' }}>
        <div style={{ padding: '0 20px 12px' }}>
          <Eyebrow>Flash deals · giới hạn thời gian</Eyebrow>
          <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 500, color: T.ink, marginTop: 6, letterSpacing: '-0.4px' }}>Vé giảm đậm tuần này</div>
        </div>
        <div className="of-scroll-x" style={{ display: 'flex', overflowX: 'auto', padding: '0 20px' }}>
          {flash.map((d) => <FlashDealCard key={d.route} d={d} onTap={() => navigate('/search')} />)}
        </div>
      </div>
      )}

      {/* Earn more */}
      <div style={{ padding: '28px 20px 4px' }}>
        <Eyebrow>Lấy thêm mã</Eyebrow>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <EarnRow icon={<Ic.user size={16} stroke={T.ink2} />} title="Giới thiệu bạn bè" sub="Bạn và bạn bè cùng nhận 150.000đ cho chuyến đầu" value="+150.000đ" />
          <EarnRow icon={<Ic.radar size={16} stroke={T.ink2} />} title="Hoàn thành 3 Fare Hunt" sub="Đặt vé từ kết quả săn — đã 1/3" value="+200.000đ" />
          <EarnRow icon={<Ic.spark size={16} stroke={T.ink2} />} title="Đánh giá chuyến bay" sub="2 chuyến đang chờ đánh giá" value="+50.000đ" />
        </div>
      </div>

      <div style={{ padding: '28px 24px 16px', textAlign: 'center' }}>
        <Eyebrow dash={false} style={{ color: T.ink4 }}>Một biểu tượng thầm lặng</Eyebrow>
      </div>
    </div>
  )
}
