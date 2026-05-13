// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';


const prismaClientSingleton = () => {
  return new PrismaClient({
    // L4: Log errors in all environments; query logging only in dev
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};


declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}


const prisma = globalThis.prisma ?? prismaClientSingleton();


export default prisma;


if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
