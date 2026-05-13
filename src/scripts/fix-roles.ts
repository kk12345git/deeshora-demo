import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating "DELIVERY" roles to "CUSTOMER" via Raw SQL...');

  const count = await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "role" = 'CUSTOMER' WHERE "role" = 'DELIVERY'`,
  );

  console.log(`✅ Updated ${count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
