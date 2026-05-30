// OpenFly — typed mock data (Vietnam market), ported from the prototype's
// data.js + data-hunter.js. Mock-first: screens render against these until the
// real API is wired (then a useQuery's queryFn swaps to fetch()).
//
// NOTE: prices here are in "k" units (1450 = 1.450.000đ). The backend stores full
// VND (Q-45) — convert at the API-integration boundary (see fmtVnd in tokens.ts).

export interface Airline { code: string; name: string; short: string; color: string }
export interface Airport { code: string; city: string; name: string }
export interface Destination { code: string; city: string; reason: string; priceFrom: number; hue: string }
export interface Voucher { code: string; title: string; expires: string }

export type HuntStatus = 'found' | 'hunting'

/** Lightweight hunt as shown on the mobile Home strip (data.js ACTIVE_HUNTS). */
export interface ActiveHunt {
  id: string
  from: string
  to: string
  window: string
  target: number
  current: number
  trend: number[]
  status: HuntStatus
  foundDate?: string
}

/** Full hunt record (data-hunter.js HUNTS) — used by the desktop Home + Hunter screens. */
export interface Hunt {
  id: string
  from: string
  to: string
  window: string
  windowShort: string
  target: number
  best: number
  bestDate: string
  pax: number
  cabin: string
  airlines: string[]
  channels: string[]
  frequency: number
  status: HuntStatus
  createdDaysAgo: number
  scans: number
  notifSent: number
  trend30: number[]
  aiTrend: { dir: 'up' | 'down' | 'flat'; text: string }
}

export const AIRLINES: Record<string, Airline> = {
  VN: { code: 'VN', name: 'Vietnam Airlines', short: 'Vietnam Airlines', color: '#003B71' },
  VJ: { code: 'VJ', name: 'Vietjet Air', short: 'Vietjet', color: '#E40028' },
  QH: { code: 'QH', name: 'Bamboo Airways', short: 'Bamboo', color: '#0E7A6B' },
  BL: { code: 'BL', name: 'Pacific Airlines', short: 'Pacific', color: '#FF6B00' },
  VU: { code: 'VU', name: 'Vietravel Airlines', short: 'Vietravel', color: '#1E66B3' },
}

export const AIRPORTS: Record<string, Airport> = {
  HAN: { code: 'HAN', city: 'Hà Nội', name: 'Sân bay Nội Bài' },
  SGN: { code: 'SGN', city: 'TP. Hồ Chí Minh', name: 'Tân Sơn Nhất' },
  DAD: { code: 'DAD', city: 'Đà Nẵng', name: 'Sân bay Đà Nẵng' },
  CXR: { code: 'CXR', city: 'Nha Trang', name: 'Cam Ranh' },
  PQC: { code: 'PQC', city: 'Phú Quốc', name: 'Phú Quốc' },
  HUI: { code: 'HUI', city: 'Huế', name: 'Phú Bài' },
  VCA: { code: 'VCA', city: 'Cần Thơ', name: 'Cần Thơ' },
  HPH: { code: 'HPH', city: 'Hải Phòng', name: 'Cát Bi' },
}

export const ACTIVE_HUNTS: ActiveHunt[] = [
  { id: 'h-001', from: 'HAN', to: 'DAD', window: '10—20 thg 6', target: 1000, current: 890, trend: [1280, 1340, 1180, 1090, 980, 960, 890], status: 'found', foundDate: '15 thg 6' },
  { id: 'h-002', from: 'SGN', to: 'PQC', window: 'Tuần cuối thg 7', target: 800, current: 870, trend: [1100, 1050, 980, 920, 890, 900, 870], status: 'hunting' },
]

export const HUNTS: Hunt[] = [
  {
    id: 'h-001', from: 'HAN', to: 'DAD', window: '10 — 20 thg 6, 2026', windowShort: '10—20 thg 6',
    target: 1000, best: 890, bestDate: '15 thg 6', pax: 1, cabin: 'Phổ thông',
    airlines: ['VN', 'VJ', 'QH'], channels: ['telegram', 'email', 'push'], frequency: 2,
    status: 'found', createdDaysAgo: 8, scans: 96, notifSent: 3,
    trend30: [1280, 1290, 1340, 1310, 1180, 1090, 1120, 1180, 1250, 1310, 1290, 1200, 1140, 1090, 1050, 1020, 980, 960, 1020, 1080, 1140, 1190, 1100, 1020, 970, 940, 920, 910, 900, 890],
    aiTrend: { dir: 'down', text: 'Giá thường giảm vào giữa tuần. Có thể giảm thêm 5–10% trong 4 ngày tới.' },
  },
  {
    id: 'h-002', from: 'SGN', to: 'PQC', window: '25 — 31 thg 7, 2026', windowShort: 'Tuần cuối thg 7',
    target: 800, best: 870, bestDate: '28 thg 7', pax: 2, cabin: 'Phổ thông',
    airlines: ['VN', 'VJ', 'BL'], channels: ['telegram', 'zalo', 'push'], frequency: 2,
    status: 'hunting', createdDaysAgo: 4, scans: 48, notifSent: 0,
    trend30: [1100, 1120, 1080, 1050, 1090, 1130, 1180, 1150, 1100, 1050, 1020, 980, 950, 970, 1020, 1080, 1100, 1050, 990, 940, 920, 900, 920, 950, 980, 940, 900, 880, 870, 870],
    aiTrend: { dir: 'flat', text: 'Giá ổn định quanh 870.000–920.000đ. Khả năng có giá tốt vào 3–4 ngày trước khởi hành.' },
  },
  {
    id: 'h-003', from: 'HAN', to: 'SGN', window: 'Cả tháng 8, 2026', windowShort: 'Tháng 8',
    target: 1200, best: 1450, bestDate: '14 thg 8', pax: 1, cabin: 'Phổ thông',
    airlines: ['VN', 'VJ', 'QH', 'BL'], channels: ['email', 'push'], frequency: 4,
    status: 'hunting', createdDaysAgo: 12, scans: 144, notifSent: 1,
    trend30: [1820, 1750, 1690, 1620, 1580, 1540, 1610, 1680, 1720, 1690, 1640, 1590, 1560, 1530, 1500, 1480, 1510, 1550, 1590, 1620, 1580, 1540, 1510, 1490, 1470, 1450, 1480, 1500, 1470, 1450],
    aiTrend: { dir: 'up', text: 'Mùa cao điểm — giá có xu hướng tăng. Cân nhắc đặt khi chạm 1.350.000đ.' },
  },
  {
    id: 'h-004', from: 'DAD', to: 'CXR', window: '1 — 15 thg 9, 2026', windowShort: '1—15 thg 9',
    target: 1100, best: 980, bestDate: '8 thg 9', pax: 2, cabin: 'Phổ thông',
    airlines: ['VN', 'VJ'], channels: ['telegram', 'email'], frequency: 3,
    status: 'found', createdDaysAgo: 15, scans: 120, notifSent: 2,
    trend30: [1450, 1420, 1380, 1350, 1310, 1280, 1320, 1360, 1330, 1290, 1250, 1220, 1190, 1160, 1140, 1120, 1100, 1070, 1050, 1030, 1020, 1010, 990, 980, 1000, 1010, 990, 980, 980, 980],
    aiTrend: { dir: 'flat', text: 'Đã đạt vùng giá đáy. Khả năng giảm thêm thấp — nên đặt sớm.' },
  },
]

export const DESTINATIONS: Destination[] = [
  { code: 'DAD', city: 'Đà Nẵng', reason: 'Mùa biển đẹp, giá đang thấp', priceFrom: 890, hue: '#C99A2C' },
  { code: 'PQC', city: 'Phú Quốc', reason: 'Cuối tuần dài tháng 7', priceFrom: 1280, hue: '#4A8A6F' },
  { code: 'CXR', city: 'Nha Trang', reason: 'Bạn từng tìm 2 tuần trước', priceFrom: 1050, hue: '#A14B2C' },
]

export const VOUCHERS: Voucher[] = [
  { code: 'OPENFLY150', title: 'Giảm 150.000đ chuyến nội địa', expires: '30/06' },
  { code: 'SUMMER20', title: 'Giảm 20% chuyến biển', expires: '15/07' },
]

// ─── Deals screen ───────────────────────────────────────────
export type VoucherTone = 'ink' | 'rust' | 'ink2' | 'ink4'
export interface MyVoucher { code: string; title: string; sub: string; expires: string; used: boolean; tone: VoucherTone }

export const MY_VOUCHERS: MyVoucher[] = [
  { code: 'OPENFLY150', title: 'Giảm 150.000đ chuyến nội địa', sub: 'Áp dụng cho mọi vé ≥ 1.000.000đ', expires: '30 thg 6, 2026', used: false, tone: 'ink' },
  { code: 'SUMMER20', title: 'Giảm 20% chuyến biển', sub: 'PQC, DAD, CXR, HUI', expires: '15 thg 7, 2026', used: false, tone: 'rust' },
  { code: 'SOL-WELCOME', title: 'Quà chào mừng · giảm 100.000đ', sub: 'Cho chuyến đầu với Sol', expires: '01 thg 8, 2026', used: false, tone: 'ink2' },
  { code: 'MAY-FLY50', title: 'Đã dùng · giảm 50.000đ', sub: 'Đặt VN165 ngày 10 thg 5', expires: 'Đã dùng', used: true, tone: 'ink4' },
]

export interface FlashDeal { from: string; to: string; route: string; city: string; price: number; was: number; badge: string; ends: string; hue: string }

export const FLASH_DEALS: FlashDeal[] = [
  { from: 'SGN', to: 'PQC', route: 'SGN → PQC', city: 'Phú Quốc', price: 690, was: 1180, badge: 'Nội địa', ends: 'Còn 8 giờ', hue: '#4A8A6F' },
  { from: 'HAN', to: 'CXR', route: 'HAN → CXR', city: 'Nha Trang', price: 820, was: 1290, badge: 'Nội địa', ends: 'Còn 1 ngày', hue: '#A14B2C' },
  { from: 'DAD', to: 'SGN', route: 'DAD → SGN', city: 'TP.HCM', price: 540, was: 890, badge: 'Cuối tuần', ends: 'Còn 3 giờ', hue: '#C99A2C' },
]

// ─── Search / Results ───────────────────────────────────────
export interface Flight {
  id: string
  airline: string
  number: string
  aircraft: string
  depart: string
  arrive: string
  duration: string
  stops: number
  from: string
  to: string
  date: string
  price: number
  basePrice: number
  tax: number
  fee: number
  cabin: string
  baggage: { carry: string; check: string }
  refundable: string
  insight: { tone: 'good' | 'note'; text: string } | null
  solPick?: boolean
  solReason?: string
}

export interface PriceCalDay { price: number; tone: 'low' | 'mid' | 'high' }

export interface SearchContext { from: string; to: string; date: string; dateLabel: string; pax: number; cabin: string }

export const DEFAULT_SEARCH: SearchContext = {
  from: 'HAN', to: 'DAD', date: '2026-06-15', dateLabel: 'CN, 15 thg 6', pax: 1, cabin: 'Phổ thông',
}

// HAN → DAD flights (15 thg 6, 2026) — realistic VND pricing in "k" units.
export const FLIGHTS: Flight[] = [
  { id: 'fl-001', airline: 'VN', number: 'VN165', aircraft: 'Airbus A321neo', depart: '06:10', arrive: '07:35', duration: '1g 25p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 1450, basePrice: 1180, tax: 220, fee: 50, cabin: 'Phổ thông', baggage: { carry: '7kg', check: '23kg' }, refundable: 'Đổi vé có phí', insight: null },
  { id: 'fl-002', airline: 'VJ', number: 'VJ513', aircraft: 'Airbus A321', depart: '07:25', arrive: '08:55', duration: '1g 30p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 890, basePrice: 720, tax: 130, fee: 40, cabin: 'Phổ thông', baggage: { carry: '7kg', check: 'Mua thêm' }, refundable: 'Không hoàn, đổi có phí', insight: { tone: 'good', text: 'Thấp hơn 18% so với trung bình tuần' }, solPick: true, solReason: 'Giá thấp hơn 18% so với trung bình tuần, khung giờ thuận tiện cho chuyến công tác trong ngày.' },
  { id: 'fl-003', airline: 'QH', number: 'QH202', aircraft: 'Airbus A321', depart: '09:30', arrive: '10:55', duration: '1g 25p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 1180, basePrice: 970, tax: 170, fee: 40, cabin: 'Phổ thông', baggage: { carry: '7kg', check: '20kg' }, refundable: 'Đổi vé miễn phí trước 24h', insight: null },
  { id: 'fl-004', airline: 'VN', number: 'VN169', aircraft: 'Airbus A350', depart: '11:45', arrive: '13:10', duration: '1g 25p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 1680, basePrice: 1380, tax: 240, fee: 60, cabin: 'Phổ thông', baggage: { carry: '10kg', check: '23kg' }, refundable: 'Đổi vé có phí', insight: null },
  { id: 'fl-005', airline: 'VJ', number: 'VJ517', aircraft: 'Airbus A320', depart: '14:20', arrive: '15:50', duration: '1g 30p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 950, basePrice: 780, tax: 130, fee: 40, cabin: 'Phổ thông', baggage: { carry: '7kg', check: 'Mua thêm' }, refundable: 'Không hoàn, đổi có phí', insight: null },
  { id: 'fl-006', airline: 'BL', number: 'BL522', aircraft: 'Airbus A321', depart: '16:55', arrive: '18:20', duration: '1g 25p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 1090, basePrice: 890, tax: 160, fee: 40, cabin: 'Phổ thông', baggage: { carry: '7kg', check: '20kg' }, refundable: 'Đổi vé có phí', insight: null },
  { id: 'fl-007', airline: 'VN', number: 'VN175', aircraft: 'Airbus A321neo', depart: '19:30', arrive: '20:55', duration: '1g 25p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 1320, basePrice: 1080, tax: 200, fee: 40, cabin: 'Phổ thông', baggage: { carry: '7kg', check: '23kg' }, refundable: 'Đổi vé có phí', insight: { tone: 'note', text: 'Thường đúng giờ 92% chuyến gần đây' } },
  { id: 'fl-008', airline: 'QH', number: 'QH212', aircraft: 'Embraer 190', depart: '21:40', arrive: '23:05', duration: '1g 25p', stops: 0, from: 'HAN', to: 'DAD', date: '2026-06-15', price: 780, basePrice: 620, tax: 120, fee: 40, cabin: 'Phổ thông', baggage: { carry: '7kg', check: '20kg' }, refundable: 'Không hoàn, đổi có phí', insight: { tone: 'good', text: 'Giá tốt nhất trong ngày' } },
]

// ─── Fare Hunter detail data ────────────────────────────────
export interface NotifLogEntry { id: number; time: string; channel: string; title: string; date: string }

export const NOTIF_LOG: NotifLogEntry[] = [
  { id: 1, time: '2h trước', channel: 'telegram', title: 'Giá xuống 890.000đ — thấp hơn mục tiêu', date: 'Hôm nay · 14:32' },
  { id: 2, time: '1 ngày', channel: 'email', title: 'Vé 920.000đ cho ngày 17 thg 6', date: 'Hôm qua · 09:15' },
  { id: 3, time: '3 ngày', channel: 'push', title: 'Cập nhật xu hướng giá — giảm 4%', date: '12 thg 6 · 18:40' },
]

export interface ChannelInfo { name: string; desc: string; user: string }

export const CHANNELS: Record<string, ChannelInfo> = {
  telegram: { name: 'Telegram', desc: 'Tin nhắn tức thì với nút đặt nhanh', user: '@andy_dao' },
  email: { name: 'Email', desc: 'Chi tiết đầy đủ kèm link đặt', user: 'andy.dao@gmail.com' },
  zalo: { name: 'Zalo', desc: 'Thông báo qua OpenFly OA', user: 'Andy Đào' },
  push: { name: 'Push', desc: 'Thông báo đẩy trong ứng dụng', user: 'iPhone' },
}

// ─── Booking / Trips ────────────────────────────────────────
export interface SavedPassenger { id: string; name: string; gender: string; dob: string; cccd: string; primary: boolean; initials: string; child?: boolean }

export const SAVED_PASSENGERS: SavedPassenger[] = [
  { id: 'p1', name: 'Đào Andy', gender: 'Nam', dob: '04/04/1995', cccd: '001 234 567 890', primary: true, initials: 'AN' },
  { id: 'p2', name: 'Nguyễn Linh', gender: 'Nữ', dob: '12/08/1993', cccd: '001 234 567 891', primary: false, initials: 'LN' },
  { id: 'p3', name: 'Đào Minh', gender: 'Nam', dob: '22/11/2019', cccd: '—', primary: false, initials: 'MD', child: true },
]

export type BookingStatus = 'confirmed' | 'holding' | 'completed' | 'cancelled'

export interface Booking {
  id: string; pnr: string; flightId: string
  airline: string; number: string; aircraft: string
  from: string; to: string; date: string; dateLabel: string
  depart: string; arrive: string; duration: string
  pax: SavedPassenger[]; seats: string[]; cabin: string
  baggage: { carry: string; check: string }
  contact: { email: string; phone: string }
  total: number; basePrice: number; tax: number; fee: number; addons?: number
  voucher?: { code: string; name: string; value: number }
  payment: { method: string; last4: string; paidAt: string }
  status: BookingStatus
  checkinOpensAt?: string; holdExpiresAt?: string
}

export const BOOKINGS: Booking[] = [
  { id: 'bk-001', pnr: 'OFY8K2', flightId: 'fl-002', airline: 'VJ', number: 'VJ513', aircraft: 'Airbus A321', from: 'HAN', to: 'DAD', date: '2026-06-15', dateLabel: 'CN, 15 thg 6 · 2026', depart: '07:25', arrive: '08:55', duration: '1g 30p', pax: [SAVED_PASSENGERS[0]], seats: ['12A'], cabin: 'Phổ thông', baggage: { carry: '7kg', check: '20kg (đã mua thêm)' }, contact: { email: 'andy.dao@gmail.com', phone: '+84 938 121 234' }, total: 1090, basePrice: 720, tax: 130, fee: 40, addons: 200, voucher: { code: 'OPENFLY150', name: 'Giảm 150.000đ chuyến nội địa', value: -150 }, payment: { method: 'SePay · Vietcombank', last4: '··· 6478', paidAt: '12 thg 6 · 09:42' }, status: 'confirmed', checkinOpensAt: 'mở sau 19h nữa' },
  { id: 'bk-002', pnr: 'OFY3M9', flightId: 'fl-007', airline: 'VN', number: 'VN175', aircraft: 'Airbus A321neo', from: 'SGN', to: 'HUI', date: '2026-06-28', dateLabel: 'CN, 28 thg 6 · 2026', depart: '14:45', arrive: '16:15', duration: '1g 30p', pax: [SAVED_PASSENGERS[0], SAVED_PASSENGERS[1]], seats: ['—', '—'], cabin: 'Phổ thông', baggage: { carry: '7kg', check: '23kg' }, contact: { email: 'andy.dao@gmail.com', phone: '+84 938 121 234' }, total: 2640, basePrice: 2160, tax: 400, fee: 80, payment: { method: '—', last4: '', paidAt: '' }, status: 'holding', holdExpiresAt: 'giữ đến 14:32 hôm nay' },
  { id: 'bk-003', pnr: 'OFY1A7', flightId: 'fl-004', airline: 'VN', number: 'VN169', aircraft: 'Airbus A350', from: 'HAN', to: 'SGN', date: '2026-05-10', dateLabel: 'T7, 10 thg 5 · 2026', depart: '08:30', arrive: '10:45', duration: '2g 15p', pax: [SAVED_PASSENGERS[0]], seats: ['8C'], cabin: 'Phổ thông', baggage: { carry: '7kg', check: '23kg' }, contact: { email: 'andy.dao@gmail.com', phone: '+84 938 121 234' }, total: 1820, basePrice: 1480, tax: 280, fee: 60, payment: { method: 'SePay · Techcombank', last4: '··· 1234', paidAt: '05 thg 5 · 14:20' }, status: 'completed' },
  { id: 'bk-004', pnr: 'OFY2C5', flightId: 'fl-005', airline: 'VJ', number: 'VJ517', aircraft: 'Airbus A320', from: 'DAD', to: 'HAN', date: '2026-04-02', dateLabel: 'T5, 2 thg 4 · 2026', depart: '14:20', arrive: '15:50', duration: '1g 30p', pax: [SAVED_PASSENGERS[0]], seats: ['15F'], cabin: 'Phổ thông', baggage: { carry: '7kg', check: 'Không' }, contact: { email: 'andy.dao@gmail.com', phone: '+84 938 121 234' }, total: 950, basePrice: 780, tax: 130, fee: 40, payment: { method: 'SePay · MB Bank', last4: '', paidAt: '28 thg 3 · 20:15' }, status: 'completed' },
]

// Price calendar (June 2026) — day → { price (k), tone }.
export const PRICE_CALENDAR_JUN: Record<number, PriceCalDay> = {
  10: { price: 1180, tone: 'mid' }, 11: { price: 1290, tone: 'mid' },
  12: { price: 1450, tone: 'high' }, 13: { price: 1580, tone: 'high' },
  14: { price: 1120, tone: 'mid' }, 15: { price: 890, tone: 'low' },
  16: { price: 920, tone: 'low' }, 17: { price: 980, tone: 'low' },
  18: { price: 1080, tone: 'mid' }, 19: { price: 1340, tone: 'high' },
  20: { price: 1490, tone: 'high' }, 21: { price: 1290, tone: 'mid' },
  22: { price: 980, tone: 'low' }, 23: { price: 960, tone: 'low' },
  24: { price: 1140, tone: 'mid' }, 25: { price: 1280, tone: 'mid' },
}

// Notification inbox — ported from screens-polish.jsx INBOX_ITEMS (the richer model).
// `kind` drives the icon + accent (resolved in the Inbox UI); CTAs link to real routes.
export type InboxKind = 'hunt-found' | 'booking' | 'sol' | 'price' | 'voucher' | 'checkin'
export interface InboxItem {
  id: string
  group: 'today' | 'earlier'
  when: string
  unread: boolean
  kind: InboxKind
  title: string
  body: string
  cta?: { label: string; href: string }
}

export const INBOX_ITEMS: InboxItem[] = [
  { id: 'n1', group: 'today', when: '14:32', unread: true, kind: 'hunt-found', title: 'Sol tìm thấy giá tốt cho HAN → DAD', body: 'Vietjet VJ513 · 890.000đ · thấp hơn mục tiêu của bạn 110.000đ.', cta: { label: 'Xem chi tiết', href: '/hunter/h-001' } },
  { id: 'n2', group: 'today', when: '11:08', unread: true, kind: 'booking', title: 'Booking OFY3M9 đang giữ chỗ', body: 'SGN → HUI, 28 thg 6. Còn 2g 14p để hoàn tất thanh toán.', cta: { label: 'Thanh toán', href: '/trips/bk-002' } },
  { id: 'n3', group: 'today', when: '09:15', unread: false, kind: 'sol', title: 'Sol gửi bạn một gợi ý', body: '“Tháng 7 vào mùa biển — Phú Quốc giảm giá. Mình lập Fare Hunt nhé?”', cta: { label: 'Hỏi Sol', href: '/sol' } },
  { id: 'n4', group: 'earlier', when: 'Hôm qua · 18:40', unread: false, kind: 'price', title: 'Giá HAN → SGN giảm 4%', body: 'Chặng bạn theo dõi giảm còn 1.450.000đ. Vẫn cao hơn mục tiêu 250.000đ.', cta: { label: 'Xem biểu đồ', href: '/hunter/h-003' } },
  { id: 'n5', group: 'earlier', when: '2 ngày trước', unread: false, kind: 'voucher', title: 'Mã SUMMER20 sắp hết hạn', body: 'Giảm 20% chuyến biển — còn 18 ngày để dùng.', cta: { label: 'Xem ưu đãi', href: '/deals' } },
  { id: 'n6', group: 'earlier', when: '5 ngày trước', unread: false, kind: 'checkin', title: 'Check-in cho VN165 đã mở', body: 'Chuyến HAN → SGN ngày 10/5. Chọn ghế trong ứng dụng.' },
]
