// OpenFly — Create Fare Hunt (mobile), ported from screens-hunter.jsx HunterCreateScreen.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Price, SectionLabel, Toggle, Ic, ChannelIcon } from '../../components/ui'
import { AIRPORTS } from '../../data/mock'

const WINDOWS = [
  { id: 'jun-w2', label: 'Tuần thứ 2 thg 6', hint: '8 — 14 thg 6' },
  { id: 'jun-w3', label: 'Tuần thứ 3 thg 6', hint: '15 — 21 thg 6' },
  { id: 'jun-all', label: 'Cả tháng 6', hint: '1 — 30 thg 6' },
  { id: 'flex', label: 'Bất cứ ngày nào', hint: '2 tháng tới · linh hoạt' },
]
const CHANNEL_DEFS = [
  { id: 'telegram', label: 'Telegram', desc: 'Tin nhắn tức thì + nút đặt nhanh' },
  { id: 'email', label: 'Email', desc: 'Chi tiết đầy đủ kèm link đặt' },
  { id: 'zalo', label: 'Zalo', desc: 'Qua OpenFly Official Account' },
  { id: 'push', label: 'Thông báo đẩy', desc: 'Trong ứng dụng OpenFly' },
]

export function HunterCreateMobile() {
  const navigate = useNavigate()
  const [from, setFrom] = useState('HAN')
  const [to, setTo] = useState('DAD')
  const [windowPreset, setWindowPreset] = useState('jun-w2')
  const [target, setTarget] = useState(950)
  const [channels, setChannels] = useState<Record<string, boolean>>({ telegram: true, email: true, zalo: false, push: true })
  const [freq, setFreq] = useState(2)
  const a1 = AIRPORTS[from]
  const a2 = AIRPORTS[to]
  const nCh = Object.values(channels).filter(Boolean).length

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 8px' }}>
        <button onClick={() => navigate('/hunter')} aria-label="Quay lại" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.back size={16} stroke={T.ink} />
        </button>
        <Eyebrow dash={false}>Tạo Fare Hunt</Eyebrow>
      </div>

      <div style={{ padding: '4px 20px 0' }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, letterSpacing: '-0.9px', lineHeight: 1.1, color: T.ink, margin: '10px 0 6px' }}>
          Cho Sol biết bạn <em style={{ color: T.rust, fontWeight: 500 }}>muốn bay đâu</em>.
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: 13, color: T.ink3, fontStyle: 'italic', lineHeight: 1.5, margin: 0, marginBottom: 22, maxWidth: 320 }}>
          Càng linh hoạt về ngày, Sol càng có cơ hội tìm được giá tốt nhất.
        </p>

        {/* 01 Route */}
        <SectionLabel num="01" title="Chặng bay" />
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, marginTop: 10, marginBottom: 24, padding: 4 }}>
          <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>
            <div style={{ flex: 1, padding: '14px 16px' }}>
              <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Từ</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{from}</span>
                <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>{a1.city}</span>
              </div>
            </div>
            <button onClick={() => { setFrom(to); setTo(from) }} aria-label="Đổi chiều" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 32, height: 32, borderRadius: '50%', background: T.paper, border: `1px solid ${T.line2}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Ic.swap size={14} stroke={T.ink2} />
            </button>
            <div style={{ width: 1, background: T.line, margin: '8px 0' }} />
            <div style={{ flex: 1, padding: '14px 16px', textAlign: 'right' }}>
              <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>Đến</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>{a2.city}</span>
                <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.5px' }}>{to}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 02 Window */}
        <SectionLabel num="02" title="Khoảng thời gian linh hoạt" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, marginBottom: 24 }}>
          {WINDOWS.map((w) => {
            const active = windowPreset === w.id
            return (
              <button key={w.id} onClick={() => setWindowPreset(w.id)} style={{ padding: '12px 14px', borderRadius: 6, textAlign: 'left', border: `1px solid ${active ? T.ink : T.line}`, background: active ? T.ink : T.paper2, color: active ? T.paper : T.ink, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px', lineHeight: 1.2 }}>{w.label}</div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: active ? 'rgba(245,241,234,0.55)' : T.ink3, marginTop: 4, letterSpacing: 0.2 }}>{w.hint}</div>
              </button>
            )
          })}
        </div>

        {/* 03 Target price */}
        <SectionLabel num="03" title="Giá mục tiêu" />
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: '18px 20px 16px', marginTop: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500 }}>Báo khi giá ≤</div>
              <div style={{ marginTop: 6 }}><Price value={target} size={32} /></div>
            </div>
            <button onClick={() => setTarget(950)} style={{ background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 100, padding: '6px 12px', cursor: 'pointer', fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 0.5, color: T.ink2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: T.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 8, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600 }}>S</span>
              Sol gợi ý
            </button>
          </div>
          <input type="range" min={500} max={2000} step={50} value={target} onChange={(e) => setTarget(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#A14B2C' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3 }}>500.000đ</span>
            <span style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3 }}>2.000.000đ</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0 4px 14px' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.ink, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <span style={{ fontFamily: T.serif, fontSize: 11, color: T.rustSoft, fontStyle: 'italic', fontWeight: 600 }}>S</span>
          </div>
          <p style={{ margin: 0, fontFamily: T.serif, fontSize: 12, color: T.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>
            Giá trung bình {from}–{to} tháng 6 khoảng <em style={{ color: T.ink, fontStyle: 'normal', fontWeight: 500 }}>1.100.000đ</em>. Đặt mục tiêu <em style={{ color: T.rust, fontStyle: 'normal', fontWeight: 500 }}>950.000đ</em> sẽ có cơ hội khoảng 70% trong 14 ngày.
          </p>
        </div>

        {/* 04 Channels */}
        <SectionLabel num="04" title="Thông báo qua" />
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, marginTop: 10, marginBottom: 14, overflow: 'hidden' }}>
          {CHANNEL_DEFS.map((ch, i, arr) => (
            <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${T.line}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 4, background: T.paper2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChannelIcon kind={ch.id} size={16} active={channels[ch.id]} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: T.ink }}>{ch.label}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{ch.desc}</div>
              </div>
              <Toggle on={channels[ch.id]} onClick={() => setChannels((c) => ({ ...c, [ch.id]: !c[ch.id] }))} />
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/hunter/notifs')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.rust, letterSpacing: 0.4, padding: '4px 0 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Xem trước thông báo trông thế nào <Ic.chevron size={12} stroke={T.rust} />
        </button>

        {/* 05 Frequency */}
        <SectionLabel num="05" title="Tần suất quét" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10, marginBottom: 24 }}>
          {[1, 2, 4, 8].map((h) => {
            const active = freq === h
            return (
              <button key={h} onClick={() => setFreq(h)} style={{ padding: '12px 0', borderRadius: 4, cursor: 'pointer', border: `1px solid ${active ? T.ink : T.line}`, background: active ? T.ink : T.paper2, color: active ? T.paper : T.ink, fontFamily: T.serif, fontSize: 14, fontWeight: 500 }}>{h}g</button>
            )
          })}
        </div>

        {/* CTA */}
        <button onClick={() => navigate('/hunter')} style={{ width: '100%', margin: '4px 0 8px', padding: '18px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Ic.radar size={16} stroke={T.paper} sw={1.6} /> Bắt đầu săn vé
        </button>
        <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 11, color: T.ink3, fontStyle: 'italic', marginTop: 8, paddingBottom: 8 }}>
          Sol sẽ quét mỗi {freq} giờ và báo qua {nCh} kênh.
        </div>
      </div>
    </div>
  )
}
