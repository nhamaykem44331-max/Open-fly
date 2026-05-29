# AGENTS.md — OpenFly Development Guidelines

> **Source of truth**: https://github.com/multica-ai/andrej-karpathy-skills
> **Project**: OpenFly — B2C flight booking app cho thị trường Việt Nam
> **Detailed plan**: [KEHOACH-OPENFLY-BACKEND.md](KEHOACH-OPENFLY-BACKEND.md)
> **Version**: 1.0 — 2026-05-26
> **Applicable to**: Mọi AI coding agent (OpenAI Codex, Claude Code, Cursor, Aider, Continue, ...) làm việc trong dự án này.

Tài liệu này định nghĩa **quy tắc hành vi** cho bất kỳ AI agent nào khi làm việc trong dự án OpenFly. **Áp dụng xuyên suốt toàn bộ quá trình triển khai** từ Sprint 0 đến launch và sau đó.

Phần 1-4 là Karpathy guidelines port nguyên từ repo nguồn. Phần 5 là project-specific rules cho OpenFly.

**Tradeoff**: Những guidelines này thiên về cẩn thận hơn là tốc độ. Với task nhỏ (typo, 1-line fix), dùng judgment — nhưng vẫn phải giữ đúng intent của user.

> **Lưu ý quan trọng cho mọi agent**: File này có copy tên `CLAUDE.md` (cùng nội dung) ở cùng thư mục để hỗ trợ Claude Code auto-load. Hai file luôn đồng bộ — sửa file nào thì phải sync sang file kia. Khuyến nghị: sửa một file, sau đó `cp AGENTS.md CLAUDE.md` (hoặc ngược lại) để giữ chúng identical.

---

## 1. Think Before Coding

**Không đoán. Không che giấu sự bối rối. Trình bày rõ trade-off.**

Trước khi implement:
- Nêu rõ assumptions. Nếu không chắc → hỏi.
- Nếu có nhiều cách hiểu → trình bày tất cả, ĐỪNG tự chọn ngầm.
- Nếu có cách đơn giản hơn → nói ra. Push back khi cần.
- Nếu có gì confuse có thể ảnh hưởng financial data / auth / production behavior → dừng lại và clarify.

## 2. Simplicity First

**Lượng code tối thiểu giải quyết được vấn đề. Không suy đoán.**

- Không thêm tính năng ngoài yêu cầu.
- Không tạo abstraction cho code chỉ dùng 1 lần.
- Không thêm "flexibility" / "configurability" trước khi được yêu cầu.
- Không error handling cho scenario không thể xảy ra.
- Nếu viết 200 dòng mà có thể 50 dòng → viết lại.

Hỏi mình: "Một senior engineer có gọi cái này là overcomplicated không?" Nếu có → simplify.

## 3. Surgical Changes

**Chỉ chạm vào những gì BẮT BUỘC phải đổi. Chỉ clean up do chính mình tạo ra.**

Khi edit code có sẵn:
- Không "improve" code/comment/format không liên quan.
- Không refactor cái đang hoạt động trừ khi user yêu cầu.
- Match style hiện có, dù bạn thấy cách khác hay hơn.
- Nếu thấy dead code không liên quan → **mention** trong report, đừng tự xóa.

Khi change tạo orphan:
- Xóa import/variable/function mà chính change của bạn làm unused.
- KHÔNG xóa dead code có sẵn trừ khi được yêu cầu.

**Test**: mỗi dòng thay đổi phải truy về được yêu cầu của user.

## 4. Goal-Driven Execution

**Định nghĩa success criteria. Lặp đến khi verify được.**

Biến task thành verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

Cho task nhiều bước, viết plan ngắn:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Success criteria mạnh cho phép loop độc lập. Criteria yếu ("make it work") yêu cầu clarification liên tục.

---

## 5. OpenFly-specific rules

### 5.1. Tech stack & repo structure

OpenFly là monorepo Turborepo:
- `apps/api/` — NestJS 10 + Prisma 5 + PostgreSQL
- `apps/web/` — Vite + React 18 + TypeScript (PWA cho end-user)
- `apps/admin/` — Next.js 14 (admin panel cho team OpenFly)

**Reference repo cho admin panel**: `C:\Cá Nhân\apg-manager\apg-manager` — port pattern từ đây (xem mục 11D trong KEHOACH-OPENFLY-BACKEND.md).

### 5.2. Tiếng Việt UTF-8 nghiêm ngặt

Bắt buộc:
- Mọi file source, doc, text hiển thị user phải lưu **UTF-8 không BOM**
- Mọi câu tiếng Việt hiển thị phải viết **đầy đủ dấu**
- KHÔNG commit chuỗi mojibake (`Ã`, `â`, `Ä`, `á»...`, `�`)
- Khi sửa file có tiếng Việt → verify lại trong browser/response trước khi commit
- Không suy luận text từ chuỗi đã lỗi mã hóa — phải sửa source gốc

### 5.3. Database & Prisma

- KHÔNG sửa `schema.prisma` mà không tạo migration file
- Mọi giá tiền lưu dạng `Int` đơn vị **VND nguyên đồng** (2592000 = 2.592.000 VND) — KHÔNG chia 1000 (Q-45, chốt 2026-05-28). Lý do: SePay/Muadi đều dùng full VND → tránh lỗi 1000x; PERCENT markup giữ precision
- Foreign key dùng `onDelete: Cascade` cẩn thận — đặc biệt KHÔNG cascade Booking khi User bị xóa (giữ audit/legal)
- `rawMuadiJson`, `rawCreatePayload` JSON blob có TTL 30 ngày — auto-cleanup

### 5.4. Auth & secrets

- KHÔNG sửa JWT/RBAC flow trừ khi explicitly yêu cầu
- KHÔNG commit secret/API key/database URL/token vào git
- Mã hóa secret trong DB bằng `APP_ENCRYPTION_KEY` env (đặc biệt: agent code Nam Thanh, AI provider API keys)
- Log mọi state change của Booking/Payment/Hunt vào AuditLog

### 5.5. PII masking

Logger bắt buộc mask PII:
- Phone: `+84***1234`
- Email: `a***@b.com`
- CCCD/passport: chỉ hiện 4 ký tự cuối
- Sentry config phải scrub PII trước khi gửi

### 5.6. Idempotency

POST nhạy cảm BẮT BUỘC support idempotency:
- `POST /bookings` (tạo booking — tránh trùng PNR)
- `POST /bookings/:id/hold`
- `POST /payments/intents`
- `POST /hunts` (tạo hunt — tránh trùng)
- Webhook payment (verify dedupeKey)

Implementation: header `Idempotency-Key`, cache trong Redis 5 phút, return cached response nếu duplicate.

### 5.7. External calls

Mọi external call (Muadi, SePay, eSMS, Telegram, n8n, AI provider):
- Có timeout explicit (AbortController)
- Có retry policy explicit (exponential backoff, max retries)
- Có circuit breaker khi failure rate cao
- Log với correlation ID
- Không bao giờ block event loop quá 5s

### 5.8. Frontend (PWA + Admin)

- **LƯU Ý QUAN TRỌNG — Khi bắt đầu triển khai UI/UX (apps/web hoặc apps/admin) → NHẮC user chuyển implementer sang model Claude** (KHÔNG dùng Codex cho frontend; Lần 6 là editorial design tinh tế, cần Claude làm đúng thẩm mỹ). Ghi nhận 2026-05-28.
- Mobile-first cho `apps/web` (PWA end-user)
- Desktop-first cho `apps/admin` (Next.js admin)
- Components fetch async data BẮT BUỘC có: **loading skeleton** + **error state** + **empty state** — port từ Lần 6 (`screens-states-*.jsx` trong [OpenFly/](OpenFly/))
- TanStack Query cho server state, Zustand cho client state (kể cả theme light/dark)
- **Dark mode support BẮT BUỘC** — đã có `tokens-dark.js` và 5 màn hình tham chiếu trong Lần 6. Dùng ThemeProvider pattern, swap `T` → `D` runtime
- Toast/Modal/BottomSheet/FormField: dùng primitives từ `ui-primitives.jsx` (KHÔNG tự viết mới)
- Network states (offline/slow/sync): dùng từ `ui-network.jsx`
- Responsive breakpoints: `tight < 380` (Android narrow, iPhone SE), `wide >= 410` (iPhone Pro Max)

### 5.9. Testing

- Unit test cho business logic phức tạp (markup engine, fare hunter diff, payment matching)
- Integration test cho booking flow end-to-end (mock Muadi)
- KHÔNG ép coverage 100% — focus vào critical paths
- Mock-first: viết mock API trước khi viết Muadi client thật → frontend có thể dev song song

### 5.10. Verification expectations (Karpathy goal-driven)

**Trước khi nói task "done"**:
- Frontend change → `npm run type-check --workspace @openfly/web` (hoặc admin)
- Backend change → `npm run type-check --workspace @openfly/api`
- Database change → migration đã chạy local + dry-run trên staging
- Payment/booking change → verify với 1 PNR/orderCode cụ thể
- Deployment change → KHÔNG gọi là "deployed" cho đến khi production URL show đúng behavior

### 5.11. Commit & PR conventions

- Mỗi commit nhỏ, focused — tránh "fix bug + refactor + add feature" trong 1 commit
- Commit message tiếng Anh (vì git tool quốc tế), nhưng PR description tiếng Việt OK
- Branch name: `feat/sprint-2-fare-hunter`, `fix/sepay-webhook-dedup`, `chore/upgrade-prisma`
- Pre-commit hook chạy `npm run check:text` (scan mojibake) + type-check changed files

### 5.12. Khi không chắc — hỏi (đặc biệt cho solo dev)

Vì OpenFly là solo dev + AI agent, KHÔNG có teammate để pair review. Agent phải đóng vai "second pair of eyes":
- Khi user mô tả task mơ hồ → hỏi clarify, KHÔNG đoán
- Khi solution có nhiều cách → trình bày trade-off, để user chọn
- Khi task ảnh hưởng financial (booking, payment, refund, markup) → đặc biệt cẩn thận, double-check với user trước khi code

### 5.13. Decision log

Mọi quyết định kiến trúc lớn → cập nhật vào **Section 16 của [KEHOACH-OPENFLY-BACKEND.md](KEHOACH-OPENFLY-BACKEND.md)**.

Format:
```
Q-XX (chốt YYYY-MM-DD): <hạng mục> → <quyết định> — <lý do>
```

---

**Những guidelines này đang work khi**: ít diff không cần thiết, ít rewrite do overcomplicate, câu hỏi clarify đến TRƯỚC khi implement chứ không phải sau khi sai.
