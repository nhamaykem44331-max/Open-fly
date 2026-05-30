import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Seed/promote tài khoản admin (Q-60b). Đọc thông tin từ env — KHÔNG hardcode,
// KHÔNG commit mật khẩu. Chạy:
//   $env:ADMIN_EMAIL="ops@openfly.vn"; $env:ADMIN_PASSWORD="<mật khẩu mạnh>"; npm run seed:admin
// Nếu email đã tồn tại (vd tài khoản Google) → nâng cấp lên ADMIN + đặt mật khẩu.
const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 1)}***@${domain}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const fullName = (process.env.ADMIN_NAME ?? '').trim() || null;

  if (!email || !email.includes('@')) {
    throw new Error(
      'ADMIN_EMAIL chưa đặt hoặc không hợp lệ. VD: $env:ADMIN_EMAIL="ops@openfly.vn"',
    );
  }
  if (password.length < 8) {
    throw new Error(
      'ADMIN_PASSWORD chưa đặt hoặc dưới 8 ký tự. Đặt mật khẩu mạnh (không commit).',
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      passwordHash,
      active: true,
      blocked: false,
      blockReason: null,
      ...(fullName ? { fullName } : {}),
    },
    create: {
      email,
      role: UserRole.ADMIN,
      passwordHash,
      fullName,
      active: true,
    },
    select: { id: true, role: true, createdAt: true, updatedAt: true },
  });

  const isNew = user.createdAt.getTime() === user.updatedAt.getTime();
  console.log(
    `${isNew ? 'Đã tạo' : 'Đã cập nhật'} admin ${maskEmail(email)} (role=${user.role}, id=${user.id})`,
  );
  console.log(
    'Đăng nhập: POST /api/v1/auth/admin/login với email + mật khẩu vừa đặt.',
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
