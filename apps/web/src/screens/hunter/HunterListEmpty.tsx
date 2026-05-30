// OpenFly — Fare Hunter empty state (no hunts yet). Copy from Lần 6 spec (HunterListEmpty).
import { T } from '../../theme/tokens'
import { Eyebrow, Btn } from '../../components/ui'

export function HunterListEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
      {/* mini radar — rust dot + two faint rings */}
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: 'block' }}>
        <circle cx="36" cy="36" r="30" fill="none" stroke={T.line2} strokeWidth="1" />
        <circle cx="36" cy="36" r="18" fill="none" stroke={T.line2} strokeWidth="1" />
        <circle cx="36" cy="36" r="4" fill={T.rust} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
      </svg>
      <Eyebrow color={T.rust} style={{ marginTop: 24 }}>Sol đang chờ</Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.8px', color: T.ink, margin: '14px 0 10px', lineHeight: 1.15 }}>
        Chưa có chuyến nào để săn.
      </h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 320 }}>
        Cho Sol biết bạn muốn bay đâu, giá bao nhiêu. Sol sẽ quét 24/7 và báo bạn khi tìm thấy.
      </p>
      <div style={{ marginTop: 26, width: 260 }}>
        <Btn onClick={onCreate} full size="lg">Tạo Fare Hunt mới</Btn>
      </div>
    </div>
  )
}
