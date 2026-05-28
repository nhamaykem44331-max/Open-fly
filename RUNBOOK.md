# OpenFly Runbook

Runbook này mô tả cách setup, chạy dev local và smoke test Sprint 0 của OpenFly.

## 1. Yêu cầu hệ thống

- Node.js 20.x LTS
- npm 10.x
- Docker Desktop 4.x+ cho PostgreSQL local và Redis
- Redis 7+ nếu chạy ngoài Docker
- Git

## 2. Setup lần đầu

Clone repo và cài dependencies từ root monorepo:

```bash
git clone https://github.com/nhamaykem44331-max/Open-fly.git
cd Open-fly
npm install
```

Tạo env local cho API:

```bash
cp apps/api/.env.example apps/api/.env
```

Điền thủ công trong `apps/api/.env`:

```env
DATABASE_URL="postgresql://openfly:openfly_dev_password@localhost:5432/openfly_dev?schema=public"
DIRECT_URL="postgresql://openfly:openfly_dev_password@localhost:5432/openfly_dev?schema=public"
JWT_SECRET="<generate bằng openssl rand -hex 32>"
GOOGLE_CLIENT_ID="<lấy từ Google Cloud Console, xem section 5>"
```

Khởi động PostgreSQL + Redis local và apply migration:

```bash
docker compose up -d postgres redis
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

## 3. Chạy dev local

Mở 3 terminal riêng:

```bash
cd apps/api
npm run start:dev
```

API chạy ở `http://127.0.0.1:3001/api/v1`.

```bash
cd apps/web
npm run dev
```

Web PWA chạy ở `http://localhost:5173`.

```bash
cd apps/admin
npm run dev
```

Admin chạy ở `http://localhost:3000`.

Health check:

```bash
curl http://127.0.0.1:3001/api/v1/health
```

Kỳ vọng trả về JSON có `"status":"ok"`.

## 4. Smoke test

Chạy:

```bash
bash scripts/smoke-test.sh
```

Script verify health, Google auth mock, `/me`, refresh token rotation, invalid Google token, phone OTP đã bị disable và cache `/flights/search`.

Lưu ý: script dùng `mock-valid-token` và mock Muadi, nên API phải chạy với mock providers active, ví dụ `NODE_ENV=test` và `MUADI_USE_MOCK=true`, hoặc DI/env swap tương đương.

## 5. Google Cloud Console setup

Vào `https://console.cloud.google.com`.

Tạo project `OpenFly`, sau đó vào `APIs & Services`:

1. Vào `OAuth consent screen`.
2. Chọn `External`.
3. Thêm test users trong giai đoạn dev.
4. Vào `Credentials`.
5. Chọn `Create OAuth Client ID`.
6. Application type: `Web application`.
7. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
8. Authorized redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:3000`
9. Copy Client ID và paste vào `apps/api/.env` dưới key `GOOGLE_CLIENT_ID`.

## 6. Troubleshooting

Postgres connect refused:

```bash
docker ps
docker compose logs postgres
```

Redis connect refused:

```bash
docker ps
docker compose logs redis
```

Đảm bảo `REDIS_URL` trong `apps/api/.env` trỏ tới `redis://localhost:6379`.

Migration lỗi trong local dev:

```bash
cd apps/api
npx prisma migrate reset
```

Cảnh báo: lệnh này chỉ dùng DEV ONLY và sẽ wipe data local.

`JWT_SECRET is required` hoặc `GOOGLE_CLIENT_ID is required`:

```bash
cat apps/api/.env
```

Đảm bảo file env có đủ key và API được restart sau khi sửa.

Type errors sau khi pull:

```bash
cd apps/api
npx prisma generate
```

Port bị chiếm:

- API: kiểm tra port `3001`.
- Admin: kiểm tra port `3000`.
- Web: kiểm tra port `5173`.

## 7. Production deployment

Placeholder cho Sprint 4+.

Render, Supabase, Vercel và production migration flow sẽ được document sau. Hiện tại: skip.
