// prisma/seed.ts
import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

const serviceAreas = [
  // ── Thiruvottriyur Localities (Live) ──────────────────────────────────
  { label: 'Thiruvottriyur Town',        value: 'Thiruvottriyur Town',        zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 1  },
  { label: 'Kathivakkam',                value: 'Kathivakkam',                zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 2  },
  { label: 'Ennore',                     value: 'Ennore',                     zone: 'Thiruvottriyur', pincode: '600057', isServiceable: true,  sortOrder: 3  },
  { label: 'Vallur',                     value: 'Vallur',                     zone: 'Thiruvottriyur', pincode: '600103', isServiceable: true,  sortOrder: 4  },
  { label: 'Wimco Nagar',                value: 'Wimco Nagar',                zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 5  },
  { label: 'Mel Thiruvottriyur',         value: 'Mel Thiruvottriyur',         zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 6  },
  { label: 'Ponneri High Road',          value: 'Ponneri High Road',          zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 7  },
  { label: 'Mathur',                     value: 'Mathur',                     zone: 'Thiruvottriyur', pincode: '600068', isServiceable: true,  sortOrder: 8  },
  { label: 'Arunachalam Nagar',          value: 'Arunachalam Nagar',          zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 9  },
  { label: 'Kannagi Nagar',              value: 'Kannagi Nagar',              zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 10 },
  { label: 'Anna Nagar (North Chennai)', value: 'Anna Nagar North Chennai',   zone: 'Thiruvottriyur', pincode: '600019', isServiceable: true,  sortOrder: 11 },
  { label: 'Minjur',                     value: 'Minjur',                     zone: 'Thiruvottriyur', pincode: '601203', isServiceable: true,  sortOrder: 12 },
  // ── Coming Soon (North Chennai) ───────────────────────────────────────
  { label: 'Tondiarpet',                 value: 'Tondiarpet',                 zone: 'North Chennai',  pincode: '600081', isServiceable: false, sortOrder: 20 },
  { label: 'Washermenpet',               value: 'Washermenpet',               zone: 'North Chennai',  pincode: '600021', isServiceable: false, sortOrder: 21 },
  { label: 'Perambur',                   value: 'Perambur',                   zone: 'North Chennai',  pincode: '600011', isServiceable: false, sortOrder: 22 },
  { label: 'Vyasarpadi',                 value: 'Vyasarpadi',                 zone: 'North Chennai',  pincode: '600039', isServiceable: false, sortOrder: 23 },
  { label: 'Kolathur',                   value: 'Kolathur',                   zone: 'North Chennai',  pincode: '600099', isServiceable: false, sortOrder: 24 },
];

async function main() {
  console.log('🌱 Seeding service areas...');
  for (const area of serviceAreas) {
    await prisma.serviceArea.upsert({
      where: { value: area.value },
      create: { ...area, isActive: true },
      update: { label: area.label, zone: area.zone, pincode: area.pincode, sortOrder: area.sortOrder },
    });
  }
  console.log(`✅ Seeded ${serviceAreas.length} service areas.`);

  // ── Seed Comprehensive Categories ────────────────────────────────────
  console.log('📂 Seeding all categories...');
  const categoriesList = [
    { name: '₹1 Store', slug: 'one-rupee-store', image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800', sortOrder: 0 },
    { name: 'Combo Packs', slug: 'combo-packs', image: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc714a?w=800', sortOrder: 1 },
    { name: 'Groceries & Essentials', slug: 'groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', sortOrder: 2 },
    { name: 'Fruits & Vegetables', slug: 'fruits-veg', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800', sortOrder: 3 },
    { name: 'Meat & Fish', slug: 'meat-fish', image: 'https://images.unsplash.com/photo-1607623273573-7034ed8a9abd?w=800', sortOrder: 4 },
    { name: 'Bakery & Dairy', slug: 'bakery-dairy', image: 'https://images.unsplash.com/photo-1550583724-125581f77833?w=800', sortOrder: 5 },
    { name: 'Pharmacy & Wellness', slug: 'pharmacy', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=800', sortOrder: 6 },
    { name: 'Electronics & Gadgets', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', sortOrder: 7 },
    { name: 'Fashion & Lifestyle', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', sortOrder: 8 },
    { name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15224bbaf47?w=800', sortOrder: 9 },
    { name: 'Stationery & Office', slug: 'stationery', image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800', sortOrder: 10 },
    { name: 'Pet Care', slug: 'pet-care', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800', sortOrder: 11 },
    { name: 'Toys & Baby Care', slug: 'toys-baby', image: 'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=800', sortOrder: 12 },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesList) {
    const upserted = await prisma.category.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, upserted);
  }
  console.log(`✅ Seeded ${categoriesList.length} categories.`);

  // ── Seed Admin as Sole Vendor ─────────────────────────────────────────
  console.log('🏪 Seeding Admin as sole vendor...');
  const adminEmail = 'admin@daily1mart.in'; 
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      clerkId: 'admin_daily1mart_v1',
      email: adminEmail,
      name: 'Daily1Mart Admin',
      role: 'ADMIN',
    },
    update: { role: 'ADMIN' },
  });

  // ── Seed Sample Products ─────────────────────────────────────────────
  console.log('🍎 Seeding sample products...');
  const groceryCat = categoryMap.get('groceries');
  const oneRupeeCat = categoryMap.get('one-rupee-store');
  const comboCat = categoryMap.get('combo-packs');

  const products = [
    {
      name: 'Smart Kitchen Masterclass',
      slug: 'smart-kitchen-masterclass',
      description: '<p>Learn to organize and manage your kitchen efficiently with our digital masterclass.</p>',
      price: 299,
      mrp: 499,
      stock: 999,
      unit: 'Course',
      type: 'DIGITAL',
      images: ['https://images.unsplash.com/photo-1556911220-e15224bbaf47?w=800'],
      categoryId: groceryCat.id,
    },
    {
      name: 'Pencil Set',
      slug: 'pencil-set-1',
      description: '<p>Standard pencil for daily use.</p>',
      price: 1,
      mrp: 5,
      stock: 100,
      unit: 'Piece',
      type: 'PHYSICAL',
      images: ['https://images.unsplash.com/photo-1519332978332-21b7d621d05e?w=800'],
      categoryId: oneRupeeCat.id,
    },
    {
      name: 'Breakfast Combo',
      slug: 'breakfast-combo',
      description: '<p>Milk + Bread + Eggs bundle.</p>',
      price: 150,
      mrp: 180,
      stock: 50,
      unit: 'Pack',
      type: 'PHYSICAL',
      isCombo: true,
      images: ['https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800'],
      categoryId: comboCat.id,
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: p as any,
      update: { price: p.price, stock: p.stock, type: (p as any).type as ProductType || 'PHYSICAL' },
    });
  }
  console.log(`✅ Seeded ${products.length} products.`);
  
  // ── Seed Sample Delivery Partner ────────────────────────────────────
  console.log('🛵 Seeding sample delivery partner...');
  const sampleDeliveryEmail = 'rider@example.com';
  const deliveryUser = await prisma.user.upsert({
    where: { email: sampleDeliveryEmail },
    create: {
      clerkId: 'user_seed_d1',
      email: sampleDeliveryEmail,
      name: 'Rider Rajesh',
      role: 'DELIVERY_PARTNER',
      isDeliveryOnline: true,
    },
    update: { role: 'DELIVERY_PARTNER' },
  });

  console.log('✅ Seeded delivery partner.');

  // ── Seed Sample Activity Logs ────────────────────────────────────────
  console.log('📜 Seeding initial activity logs...');
  const activities = [
    {
      type: 'SYSTEM',
      action: 'INITIALIZATION',
      message: 'Daily1Mart Platform Monitoring System Initialized.',
      metadata: { version: '2.0.0', environment: 'production' },
    },
    {
      type: 'PRODUCT',
      action: 'CREATE',
      actorName: 'Admin',
      message: 'New digital product "Smart Kitchen Masterclass" added to inventory.',
      entityId: groceryCat.id, // Just for seed reference
      entityType: 'Product',
    }
  ];

  for (const log of activities) {
    await prisma.activityLog.create({ data: log });
  }
  console.log('✅ Seeded activity logs.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());