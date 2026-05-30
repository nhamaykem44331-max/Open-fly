// OpenFly — Deals & Vouchers (desktop), ported from desktop-account.jsx DealsPage.
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, Card, Btn, Divider, Ic } from '../../components/ui'
import { Container } from '../../shell/Container'
import type { DealsData } from '../../data/useDeals'

const PERKS: [string, boolean][] = [
  ['Giá ưu đãi hơn Standard', true],
  ['10 fare hunts đồng thời', true],
  ['Sol AI ưu tiên', true],
  ['Phòng chờ sân bay', false],
]
const EARN: [string, string][] = [
  ['Giới thiệu bạn bè', 'Mỗi người bạn mời đặt vé đầu tiên — bạn nhận 100.000đ.'],
  ['Hoàn thành hồ sơ', 'Thêm hành khách & phương thức thanh toán nhận 50.000đ.'],
]

export function DealsDesktop({ data }: { data: DealsData }) {
  const navigate = useNavigate()
  const { vouchers, flash } = data
  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 70 }}>
      <Container max={1200} style={{ paddingTop: 48 }}>
        <Eyebrow>Ưu đãi & mã giảm</Eyebrow>
        <h1 style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 300, letterSpacing: '-1.8px', color: T.ink, margin: '14px 0 28px' }}>Giá tốt dành <em style={{ color: T.rust, fontWeight: 500 }}>riêng cho bạn</em></h1>

        {/* Flash deals — no backend in Phase 1; hidden in API mode (flash is []). */}
        {flash.length > 0 && (<>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Ic.bolt size={18} stroke={T.rust} sw={1.8} />
          <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>Flash deals — giới hạn thời gian</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 44 }}>
          {flash.map((d) => (
            <Card key={d.route} hover onClick={() => navigate('/search')} style={{ overflow: 'hidden', borderRadius: 8 }}>
              <div style={{ height: 110, background: T.paper2, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 18, borderBottom: `1px solid ${T.line}` }}>
                <div style={{ position: 'absolute', right: -20, top: -16, width: 110, height: 110, borderRadius: '50%', background: d.hue, opacity: 0.16 }} />
                <span style={{ position: 'absolute', top: 14, left: 18, fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: T.rust, background: T.paper, padding: '4px 10px', borderRadius: 100, border: `1px solid ${T.line2}` }}>{d.ends}</span>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{d.route}</div>
              </div>
              <div style={{ padding: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500 }}>{d.city}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink4, textDecoration: 'line-through', marginTop: 4 }}>{fmtVnd(d.was)}đ</div>
                </div>
                <Price value={d.price} size={26} color={T.rust} />
              </div>
            </Card>
          ))}
        </div>
        </>)}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
          <div>
            <Eyebrow style={{ marginBottom: 16 }}>Mã ưu đãi của tôi · {vouchers.length}</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {vouchers.map((v) => (
                <div key={v.code} style={{ background: T.inkBlock, color: T.onInk, borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 20, opacity: v.used ? 0.5 : 1 }}>
                  <div style={{ position: 'absolute', left: -30, top: -30, width: 100, height: 100, borderRadius: '50%', border: `1px solid ${T.rust}`, opacity: 0.4 }} />
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(245,241,234,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic.gift size={24} stroke={T.rustSoft} /></div>
                  <div style={{ flex: 1 }}>
                    <Eyebrow dash={false} color={T.rustSoft} style={{ marginBottom: 6 }}>{v.used ? 'Đã sử dụng' : 'Mã ưu đãi'}</Eyebrow>
                    <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 500, color: T.onInk }}>{v.title}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: T.rustSoft, letterSpacing: 1, marginTop: 6 }}>{v.code} · HSD {v.expires}</div>
                  </div>
                  {!v.used && <Btn onClick={() => navigate('/search')} style={{ background: T.rust, color: '#F5F1EA', border: 'none' }}>Dùng ngay</Btn>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28 }}><Divider label="Cách lấy thêm" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 22 }}>
              {EARN.map(([t, d], i) => {
                const Icon = i === 0 ? Ic.user : Ic.check
                return (
                  <div key={t} style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: 22 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: T.rustTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} stroke={T.rust} /></div>
                    <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.ink, marginTop: 14 }}>{t}</div>
                    <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>{d}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ position: 'sticky', top: 86, background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 12, padding: 26 }}>
            <Eyebrow dash={false}>Hạng thành viên</Eyebrow>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px', marginTop: 10 }}>Premium</div>
            <div style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', marginTop: 4 }}>Bạn đang hưởng giá ưu đãi + 10 fare hunts đồng thời.</div>
            <div style={{ height: 1, background: T.line, margin: '18px 0' }} />
            {PERKS.map(([t, on]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: on ? T.greenTint : 'transparent', border: on ? 'none' : `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Ic.check size={11} stroke={T.green} />}</span>
                <span style={{ fontFamily: T.serif, fontSize: 14.5, color: on ? T.ink : T.ink4 }}>{t}</span>
              </div>
            ))}
            <Btn variant="secondary" full style={{ marginTop: 16 }}>Nâng cấp lên Agent</Btn>
          </div>
        </div>
      </Container>
    </div>
  )
}
