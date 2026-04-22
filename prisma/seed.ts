// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

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
    { name: 'Groceries & Essentials', slug: 'groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', sortOrder: 1 },
    { name: 'Fruits & Vegetables', slug: 'fruits-veg', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800', sortOrder: 2 },
    { name: 'Meat & Fish', slug: 'meat-fish', image: 'https://images.unsplash.com/photo-1607623273573-7034ed8a9abd?w=800', sortOrder: 3 },
    { name: 'Bakery & Dairy', slug: 'bakery-dairy', image: 'https://images.unsplash.com/photo-1550583724-125581f77833?w=800', sortOrder: 4 },
    { name: 'Pharmacy & Wellness', slug: 'pharmacy', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=800', sortOrder: 5 },
    { name: 'Electronics & Gadgets', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', sortOrder: 6 },
    { name: 'Fashion & Lifestyle', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', sortOrder: 7 },
    { name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15224bbaf47?w=800', sortOrder: 8 },
    { name: 'Stationery & Office', slug: 'stationery', image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800', sortOrder: 9 },
    { name: 'Pet Care', slug: 'pet-care', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800', sortOrder: 10 },
    { name: 'Toys & Baby Care', slug: 'toys-baby', image: 'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=800', sortOrder: 11 },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesList) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, upserted);
  }
  console.log(`✅ Seeded ${categoriesList.length} categories.`);

  // ── Seed a Sample Vendor ─────────────────────────────────────────────
  console.log('🏪 Seeding sample vendor...');
  const sampleVendorEmail = 'karthik@example.com'; 
  const user = await prisma.user.upsert({
    where: { email: sampleVendorEmail },
    create: {
      clerkId: 'user_seed_v1',
      email: sampleVendorEmail,
      name: 'Karthik S',
      role: 'VENDOR',
    },
    update: { role: 'VENDOR' },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      shopName: 'Fresh Mart & More',
      logo: 'https://res.cloudinary.com/dqr6idm0v/image/upload/v1712800000/logos/fresh-mart.png',
      phone: '9840012345',
      email: sampleVendorEmail,
      categories: ['Groceries & Essentials', 'Bakery & Dairy'],
      address: '123 Market St, Thiruvottriyur',
      city: 'Chennai',
      status: 'APPROVED',
      commissionRate: 0.1,
    },
    update: { status: 'APPROVED', categories: ['Groceries & Essentials', 'Bakery & Dairy'] },
  });

  // ── Seed Sample Products ─────────────────────────────────────────────
  console.log('🍎 Seeding sample products...');
  const groceryCat = categoryMap.get('groceries');

  const products = [
    {
      name: 'Organic Farm Fresh Milk',
      slug: 'organic-milk-1l',
      description: '<p>Pure, organic farm-fresh milk delivered daily. No preservatives added.</p>',
      price: 65,
      mrp: 75,
      stock: 50,
      unit: '1L',
      images: ['https://images.unsplash.com/photo-1550583724-125581f77833?w=800'],
      categoryId: groceryCat.id,
      vendorId: vendor.id,
    },
    {
      name: 'Premium Basmati Rice',
      slug: 'basmati-rice-5kg',
      description: '<p>Long-grain, aromatic premium basmati rice for your perfect biryanis.</p>',
      price: 549,
      mrp: 699,
      stock: 20,
      unit: '5kg',
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800'],
      categoryId: groceryCat.id,
      vendorId: vendor.id,
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: p,
      update: { price: p.price, stock: p.stock },
    });
  }
  console.log(`✅ Seeded ${products.length} products.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());