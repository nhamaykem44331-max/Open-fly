// OpenFly — Results empty state (no flights for this date). Copy from Lần 6 spec.
import { T } from '../../theme/tokens'
import { Sunmark, Eyebrow, Btn } from '../../components/ui'

export function NoResults({ onChangeDate, onCreateHunt }: { onChangeDate?: () => void; onCreateHunt?: () => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
      <div style={{ opacity: 0.35 }}><Sunmark size={56} /></div>
      <Eyebrow color={T.rust} style={{ marginTop: 26 }}>Không có chuyến phù hợp</Eyebrow>
      <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 400, letterSpacing: '-0.8px', color: T.ink, margin: '14px 0 10px', lineHeight: 1.2 }}>
        Không tìm thấy chuyến nào cho ngày này.
      </h2>
      <p style={{ fontFamily: T.serif, fontSize: 14, color: T.ink3, fontStyle: 'italic', lineHeight: 1.55, margin: 0, maxWidth: 320 }}>
        Thử một ngày khác gần đó, hoặc để Sol săn vé chặng này và báo bạn khi có giá tốt.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
        <Btn onClick={onChangeDate} variant="secondary" size="sm">Đổi ngày bay</Btn>
        <Btn onClick={onCreateHunt} size="sm">Tạo Fare Hunt</Btn>
      </div>
    </div>
  )
}
