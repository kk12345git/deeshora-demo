// prisma/seed.ts
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();


async function main() {
  console.log('Start seeding ...');


  const categories = [
    { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', sortOrder: 1 },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', sortOrder: 2 },
    { name: 'Meat & Seafood', slug: 'meat-seafood', sortOrder: 3 },
    { name: 'Bakery', slug: 'bakery', sortOrder: 4 },
    { name: 'Beverages', slug: 'beverages', sortOrder: 5 },
    { name: 'Groceries', slug: 'groceries', sortOrder: 6 },
    { name: 'Snacks', slug: 'snacks', sortOrder: 7 },
    { name: 'Personal Care', slug: 'personal-care', sortOrder: 8 },
  ];


  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('Seeded 8 categories.');


  const siteConfigs = [
    { key: 'delivery_fee', value: '40' },
    { key: 'free_delivery_above', value: '299' },
  ];


  for (const config of siteConfigs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('Seeded 2 site config keys.');


  console.log('Seeding finished.');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });