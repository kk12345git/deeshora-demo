// scripts/fix-site-config.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const configs = [
    { key: 'business_whatsapp', value: '918939318865' },
    { key: 'delivery_fee', value: '40' },
    { key: 'free_delivery_above', value: '299' },
    { key: 'platform_fixed_fee', value: '0' },
    { key: 'vendor_admission_fee', value: '700' },
  ];

  console.log('🚀 Fixing Site Configurations...');

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      create: config,
      update: { value: config.value },
    });
    console.log(`✅ Set ${config.key} = ${config.value}`);
  }

  console.log('✨ All site configurations updated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
