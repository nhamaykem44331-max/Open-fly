import { MarkupType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.markupRule.upsert({
    where: {
      id: 'seed-markup-b2c-domestic-35bps',
    },
    update: {
      name: 'B2C domestic 3.5%',
      active: true,
      priority: 10,
      channelScope: 'B2C',
      domestic: true,
      type: MarkupType.PERCENT,
      value: 350,
      tierScope: [],
    },
    create: {
      id: 'seed-markup-b2c-domestic-35bps',
      name: 'B2C domestic 3.5%',
      active: true,
      priority: 10,
      channelScope: 'B2C',
      domestic: true,
      type: MarkupType.PERCENT,
      value: 350,
      tierScope: [],
    },
  });

  await prisma.markupRule.upsert({
    where: {
      id: 'seed-markup-vj-fixed-50000',
    },
    update: {
      name: 'B2C VJ fixed 50k',
      active: true,
      priority: 20,
      channelScope: 'B2C',
      airlineCode: 'VJ',
      type: MarkupType.FIXED,
      value: 50000,
      tierScope: [],
    },
    create: {
      id: 'seed-markup-vj-fixed-50000',
      name: 'B2C VJ fixed 50k',
      active: true,
      priority: 20,
      channelScope: 'B2C',
      airlineCode: 'VJ',
      type: MarkupType.FIXED,
      value: 50000,
      tierScope: [],
    },
  });

  await prisma.markupRule.upsert({
    where: {
      id: 'seed-markup-b2c-minimum-30000',
    },
    update: {
      name: 'B2C minimum 30k',
      active: true,
      priority: 1,
      channelScope: 'B2C',
      type: MarkupType.PERCENT,
      value: 100,
      minAmount: 30000,
      tierScope: [],
    },
    create: {
      id: 'seed-markup-b2c-minimum-30000',
      name: 'B2C minimum 30k',
      active: true,
      priority: 1,
      channelScope: 'B2C',
      type: MarkupType.PERCENT,
      value: 100,
      minAmount: 30000,
      tierScope: [],
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
