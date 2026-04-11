// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';


export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();
  let user: User | null = null;


  if (userId) {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
  }


  return {
    prisma,
    userId,
    user,
    ...opts,
  };
};


const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});


export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;


/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;


/**
 * Reusable middleware to ensure
 * users are logged in
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `user` as non-nullable
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});


/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure.use(isAuthed);


/**
 * Vendor procedure
 */
export const vendorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'VENDOR') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a vendor.' });
  }
  const vendor = await prisma.vendor.findUnique({ where: { userId: ctx.user.id } });
  if (!vendor) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Vendor profile not found.' });
  }
  return next({
    ctx: {
      ...ctx,
      vendor,
    },
  });
});


/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not an admin.' });
  }
  return next({ ctx });
});