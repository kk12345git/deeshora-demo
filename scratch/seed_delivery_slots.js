const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slots = [
    { name: 'Morning (7 AM - 10 AM)', startTime: '07:00', endTime: '10:00' },
    { name: 'Late Morning (10 AM - 1 PM)', startTime: '10:00', endTime: '13:00' },
    { name: 'Evening (4 PM - 7 PM)', startTime: '16:00', endTime: '19:00' },
    { name: 'Late Evening (7 PM - 10 PM)', startTime: '19:00', endTime: '22:00' },
  ];

  for (const slot of slots) {
    await prisma.deliverySlot.upsert({
      where: { name: slot.name },
      update: { ...slot, isActive: true },
      create: { ...slot, isActive: true },
    });
  }
  console.log('Delivery slots seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
