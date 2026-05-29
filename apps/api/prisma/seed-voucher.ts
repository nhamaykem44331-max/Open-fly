import { PrismaClient } from '@prisma/client';

// Seed voucher mẫu. Giá AMOUNT là VND nguyên đồng (Q-45).
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const yearEnd = new Date('2026-12-31T23:59:59.000Z');

  const templates = [
    {
      code: 'OPENFLY150',
      title: 'Giảm 150.000đ cho chuyến đầu tiên',
      description: 'Áp dụng cho đơn từ 1.000.000đ.',
      type: 'AMOUNT' as const,
      value: 150_000,
      maxDiscount: null,
      minOrder: 1_000_000,
      perUserLimit: 1,
      tierFilter: [],
    },
    {
      code: 'SUMMER20',
      title: 'Giảm 20% mùa hè (tối đa 300.000đ)',
      description: 'Áp dụng cho mọi chặng nội địa.',
      type: 'PERCENT' as const,
      value: 20,
      maxDiscount: 300_000,
      minOrder: 500_000,
      perUserLimit: 1,
      tierFilter: [],
    },
    {
      code: 'PREMIUM100',
      title: 'Ưu đãi 100.000đ cho hội viên Premium',
      description: 'Dành riêng cho Premium/Agent.',
      type: 'AMOUNT' as const,
      value: 100_000,
      maxDiscount: null,
      minOrder: null,
      perUserLimit: 1,
      tierFilter: ['PREMIUM', 'AGENT'] as ('PREMIUM' | 'AGENT')[],
    },
  ];

  for (const tpl of templates) {
    await prisma.voucherTemplate.upsert({
      where: { code: tpl.code },
      update: {
        title: tpl.title,
        description: tpl.description,
        type: tpl.type,
        value: tpl.value,
        maxDiscount: tpl.maxDiscount,
        minOrder: tpl.minOrder,
        perUserLimit: tpl.perUserLimit,
        tierFilter: tpl.tierFilter,
        active: true,
        validUntil: yearEnd,
      },
      create: {
        code: tpl.code,
        title: tpl.title,
        description: tpl.description,
        type: tpl.type,
        value: tpl.value,
        maxDiscount: tpl.maxDiscount,
        minOrder: tpl.minOrder,
        perUserLimit: tpl.perUserLimit,
        tierFilter: tpl.tierFilter,
        airlineFilter: [],
        active: true,
        validFrom: now,
        validUntil: yearEnd,
      },
    });
    console.log(`seeded voucher ${tpl.code}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
