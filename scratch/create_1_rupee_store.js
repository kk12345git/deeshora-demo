const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: '1-rupee-store' },
    update: { name: '₹1 Store', isActive: true, sortOrder: -1 },
    create: {
      name: '₹1 Store',
      slug: '1-rupee-store',
      image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800',
      isActive: true,
      sortOrder: -1
    }
  });
  console.log('Category created/updated:', category.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
