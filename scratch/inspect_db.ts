
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const vendors = await prisma.vendor.count();
  const products = await prisma.product.count();
  const orders = await prisma.order.count();

  console.log('--- Database Stats ---');
  console.log(`Users: ${users}`);
  console.log(`Vendors: ${vendors}`);
  console.log(`Products: ${products}`);
  console.log(`Orders: ${orders}`);

  if (users > 0) {
    const latestUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { email: true, name: true, createdAt: true }
    });
    console.log('\n--- Latest Users ---');
    console.table(latestUsers);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
