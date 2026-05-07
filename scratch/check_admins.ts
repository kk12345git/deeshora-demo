
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      email: {
        in: ['deeshorasupport@gmail.com', 'karthigeyanbs44@gmail.com']
      }
    }
  });

  console.log('--- Admin Users Found ---');
  console.table(admins);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
