// scripts/check-categories.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Current Categories:', JSON.stringify(categories, null, 2));
}

main().finally(() => prisma.$disconnect());
