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
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());