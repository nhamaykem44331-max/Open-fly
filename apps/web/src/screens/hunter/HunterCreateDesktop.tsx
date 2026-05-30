// OpenFly — Create Fare Hunt (desktop), ported from desktop-hunter.jsx HunterCreatePage.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, fmtVnd } from '../../theme/tokens'
import { Eyebrow, Price, SectionLabel, Toggle, Btn, Ic, ChannelIcon } from '../../components/ui'
import { Container } from '../../shell/Container'
import { AIRPORTS } from '../../data/mock'

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: T.serif, fontSize: 14, color: T.ink2 }}>{label}</span>
      <span style={{ fontFamily: T.serif, fontSize: 14.5, color: T.ink, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const WINS: [string, string, string][] = [
  ['jun-w2', 'Tuần thứ 2 thg 6', '8 — 14 thg 6'],
  ['jun-w3', 'Tuần thứ 3 thg 6', '15 — 21 thg 6'],
  ['jun-all', 'Cả tháng 6', '1 — 30 thg 6'],
  ['flex', 'Bất cứ ngày nào', '2 tháng tới · linh hoạt'],
]
const CHANNEL_DEFS: [string, string, string][] = [
  ['telegram', 'Telegram', 'Tin nhắn tức thì + nút đặt nhanh'],
  ['email', 'Email', 'Chi tiết đầy đủ kèm link đặt'],
  ['zalo', 'Zalo', 'Qua OpenFly Official Account'],
  ['push', 'Thông báo đẩy', 'Trong ứng dụng OpenFly'],
]

export function HunterCreateDesktop() {
  const navigate = useNavigate()
  const [from, setFrom] = useState('HAN')
  const [to, setTo] = useState('DAD')
  const [win, setWin] = useState('jun-w2')
  const [target, setTarget] = useState(950)
  const [freq, setFreq] = useState(2)
  const [channels, setChannels] = useState<Record<string, boolean>>({ telegram: true, email: true, zalo: false, push: true })
  const a1 = AIRPORTS[from]
  const a2 = AIRPORTS[to]
  const nCh = Object.values(channels).filter(Boolean).length

  return (
    <div style={{ background: T.canvas, minHeight: '100%', paddingBottom: 80 }}>
      <Container max={1140} style={{ paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <button onClick={() => navigate('/hunter')} aria-label="Quay lại" style={{ width: 42, height: 42, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic.back size={17} stroke={T.ink} /></button>
          <Eyebrow>Tạo Fare Hunt</Eyebrow>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 38, fontWeight: 400, letterSpacing: '-1.5px', color: T.ink, margin: '6px 0 4px 56px' }}>Cho Sol biết bạn <em style={{ color: T.rust, fontWeight: 500 }}>muốn bay đâu</em>.</h1>
        <p style={{ fontFamily: T.serif, fontSize: 16, color: T.ink3, fontStyle: 'italic', margin: '0 0 26px 56px' }}>Càng linh hoạt về ngày, Sol càng có cơ hội tìm được giá tốt nhất.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              <SectionLabel num="01" title="Chặng bay" />
              <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', position: 'relative', marginTop: 14 }}>
                <div style={{ flex: 1, padding: '18px 22px' }}>
                  <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3 }}>Từ</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}><span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px' }}>{from}</span><span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>{a1.city}</span></div>
                </div>
                <button onClick={() => { setFrom(to); setTo(from) }} aria-label="Đổi chiều" style={{ width: 38, height: 38, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line2}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic.swap size={15} stroke={T.ink2} /></button>
                <div style={{ flex: 1, padding: '18px 22px', textAlign: 'right' }}>
                  <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3 }}>Đến</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}><span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>{a2.city}</span><span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.8px' }}>{to}</span></div>
                </div>
              </div>
            </div>
            <div>
              <SectionLabel num="02" title="Khoảng thời gian linh hoạt" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                {WINS.map(([id, l, h]) => {
                  const on = win === id
                  return (
                    <button key={id} onClick={() => setWin(id)} style={{ padding: '16px 18px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', background: on ? T.ink : T.paper, border: `1px solid ${on ? T.ink : T.line}`, color: on ? T.paper : T.ink }}>
                      <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, letterSpacing: '-0.2px' }}>{l}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 11.5, color: on ? 'rgba(245,241,234,0.6)' : T.ink3, marginTop: 5 }}>{h}</div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <SectionLabel num="03" title="Giá mục tiêu" />
              <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: '22px 24px', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: T.ink3 }}>Báo khi giá ≤</div>
                    <div style={{ marginTop: 8 }}><Price value={target} size={40} /></div>
                  </div>
                  <button onClick={() => setTarget(950)} style={{ background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 100, padding: '8px 14px', cursor: 'pointer', fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.ink2, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: T.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 9, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600 }}>S</span>Sol gợi ý
                  </button>
                </div>
                <input type="range" min={500} max={2000} step={50} value={target} onChange={(e) => setTarget(+e.target.value)} style={{ width: '100%', accentColor: '#A14B2C' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>500.000đ</span><span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>2.000.000đ</span></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: T.serif, fontSize: 13, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600 }}>S</span>
                <p style={{ margin: 0, fontFamily: T.serif, fontSize: 14, color: T.ink2, fontStyle: 'italic', lineHeight: 1.55 }}>Giá trung bình {from}–{to} tháng 6 khoảng <em style={{ color: T.ink, fontStyle: 'normal', fontWeight: 500 }}>1.100.000đ</em>. Mục tiêu <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>950.000đ</em> có cơ hội ~70% trong 14 ngày.</p>
              </div>
            </div>
            <div>
              <SectionLabel num="04" title="Thông báo qua" />
              <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, marginTop: 14, overflow: 'hidden' }}>
                {CHANNEL_DEFS.map(([id, l, d], i, arr) => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelIcon kind={id} size={18} active={channels[id]} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.ink }}>{l}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 1 }}>{d}</div>
                    </div>
                    <Toggle on={channels[id]} onClick={() => setChannels((c) => ({ ...c, [id]: !c[id] }))} />
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/hunter/notifs')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.rust, marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Xem trước thông báo trông thế nào <Ic.chevron size={13} stroke={T.rust} /></button>
            </div>
            <div>
              <SectionLabel num="05" title="Tần suất quét" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14 }}>
                {[1, 2, 4, 8].map((h) => {
                  const on = freq === h
                  return <button key={h} onClick={() => setFreq(h)} style={{ padding: '16px 0', borderRadius: 8, cursor: 'pointer', background: on ? T.ink : T.paper, border: `1px solid ${on ? T.ink : T.line}`, color: on ? T.paper : T.ink, fontFamily: T.serif, fontSize: 16, fontWeight: 500 }}>mỗi {h}g</button>
                })}
              </div>
            </div>
          </div>

          {/* sticky preview */}
          <div style={{ position: 'sticky', top: 86, background: T.paper, border: `1px solid ${T.line2}`, borderRadius: 12, padding: 26 }}>
            <Eyebrow dash={false} style={{ marginBottom: 16 }}>Tóm tắt yêu cầu</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{from}</span><Ic.arrow size={16} stroke={T.ink3} /><span style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-1px' }}>{to}</span>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 6 }}>{(WINS.find((w) => w[0] === win) || [])[1]}</div>
            <div style={{ height: 1, background: T.line, margin: '18px 0' }} />
            <SummaryRow label="Giá mục tiêu" value={`≤ ${fmtVnd(target)}đ`} />
            <SummaryRow label="Quét" value={`mỗi ${freq} giờ`} />
            <SummaryRow label="Kênh báo" value={`${nCh} kênh`} />
            <Btn onClick={() => navigate('/hunter')} variant="rust" full size="lg" style={{ marginTop: 20 }} icon={<Ic.radar size={16} stroke="#F5F1EA" />}>Bắt đầu săn vé</Btn>
            <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', marginTop: 12 }}>Sol sẽ quét mỗi {freq} giờ và báo qua {nCh} kênh.</div>
          </div>
        </div>
      </Container>
    </div>
  )
}
