// OpenFly — Booking step 1 (mobile): passenger info. Ported from screens-booking.jsx.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../../theme/tokens'
import { Eyebrow, Price, Ic } from '../../components/ui'
import type { Flight } from '../../data/mock'
import { useSavedPassengers } from '../../data/useProfile'
import { useBookingForm } from '../../stores/bookingForm'
import { useAuthStore } from '../../stores/auth'
import { StepHeader, MiniFlightCard } from './parts'

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ background: T.paper2, border: `1px solid ${T.line}`, borderRadius: 6, padding: '12px 16px' }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink3 }}>{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', marginTop: 4, background: 'transparent', border: 'none', outline: 'none', fontFamily: T.serif, fontSize: 15, color: T.ink, padding: 0 }} />
    </div>
  )
}

export function BookingPassengerMobile({ flight: f }: { flight: Flight }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setForm = useBookingForm((s) => s.set)
  const passengers = useSavedPassengers().data ?? []
  const [selectedPax, setSelectedPax] = useState<string[]>([])
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  useEffect(() => {
    if (selectedPax.length === 0 && passengers.length > 0) {
      setSelectedPax([(passengers.find((p) => p.primary) ?? passengers[0]).id])
    }
  }, [passengers, selectedPax.length])
  const togglePax = (id: string) => setSelectedPax((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const count = Math.max(1, selectedPax.length)
  const onContinue = () => {
    setForm({ passengers: passengers.filter((p) => selectedPax.includes(p.id)), email, phone })
    navigate(`/booking/${f.id}/review`)
  }

  return (
    <div style={{ background: T.paper, minHeight: '100%' }}>
      <StepHeader label="Đặt vé" step={1} />
      <div style={{ padding: '4px 20px 0' }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, letterSpacing: '-0.9px', lineHeight: 1.1, color: T.ink, margin: '14px 0 18px' }}>
          Ai sẽ <em style={{ color: T.rust, fontWeight: 500 }}>bay</em>?
        </h1>
        <MiniFlightCard flight={f} />

        <div style={{ marginTop: 24 }}>
          <Eyebrow>Hành khách đã lưu</Eyebrow>
          <div style={{ marginTop: 12, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden' }}>
            {passengers.map((p, i) => {
              const selected = selectedPax.includes(p.id)
              return (
                <button key={p.id} onClick={() => togglePax(p.id)} style={{ width: '100%', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, borderTop: i > 0 ? `1px solid ${T.line}` : 'none', background: selected ? T.paper2 : T.paper, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: selected ? T.ink : T.paper2, border: selected ? 'none' : `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.serif, fontSize: 14, fontWeight: 500, color: selected ? T.rustSoft : T.ink2, fontStyle: 'italic' }}>{p.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.serif, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: '-0.2px' }}>
                      {p.name} {p.primary && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 100, background: T.paper3, fontFamily: T.sans, fontSize: 9, fontWeight: 600, color: T.ink2, letterSpacing: 0.5, textTransform: 'uppercase' }}>chính</span>}
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>
                      {p.gender} · {p.dob}{!p.child ? ` · CCCD ${p.cccd}` : ' · Trẻ em'}
                    </div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${selected ? T.ink : T.line2}`, background: selected ? T.ink : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {selected && <Ic.check size={12} stroke={T.paper} sw={2.2} />}
                  </div>
                </button>
              )
            })}
          </div>
          <button style={{ marginTop: 10, padding: '10px 14px', background: 'transparent', border: `1px dashed ${T.line2}`, borderRadius: 6, cursor: 'pointer', width: '100%', fontFamily: T.serif, fontSize: 13, color: T.ink2, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.serif, fontSize: 18, color: T.rust, lineHeight: 0.7, marginTop: -1 }}>+</span>
            Thêm hành khách mới
          </button>
        </div>

        <div style={{ marginTop: 28 }}>
          <Eyebrow>Liên hệ nhận vé</Eyebrow>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Email" value={email} onChange={setEmail} />
            <Field label="Số điện thoại" value={phone} onChange={setPhone} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10, padding: '0 4px' }}>
            <Ic.info size={14} stroke={T.ink3} />
            <p style={{ margin: 0, fontFamily: T.serif, fontSize: 12, color: T.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
              Vé và thông báo check-in sẽ được gửi đến email và Zalo của bạn.
            </p>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 20px 20px', marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.ink3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Tổng tạm tính</div>
          <div style={{ marginTop: 2 }}><Price value={f.price * count} size={20} /></div>
        </div>
        <button onClick={onContinue} disabled={selectedPax.length === 0} style={{ padding: '15px 22px', background: T.ink, color: T.paper, border: 'none', borderRadius: 4, fontFamily: T.serif, fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px', cursor: selectedPax.length === 0 ? 'default' : 'pointer', opacity: selectedPax.length === 0 ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Tiếp tục <Ic.arrow size={14} stroke={T.paper} />
        </button>
      </div>
    </div>
  )
}
