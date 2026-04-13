// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import superjson from 'superjson';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';


const ADMIN_EMAILS = [
  'deeshorasupport@gmail.com',
  'karthigeyanbs44@gmail.com'
];


export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();
  let user: User | null = null;


  if (userId) {
    // Try to find existing user
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Auto-create DB record if user signed in via Google OAuth but
    // the Clerk webhook didn't fire (common in local dev & first deploys)
    if (!user) {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
          const firstName = clerkUser.firstName ?? '';
          const lastName = clerkUser.lastName ?? '';
          const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
          
          const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
          
          user = await prisma.user.upsert({
            where: { clerkId: userId },
            create: {
              clerkId: userId,
              email: email.toLowerCase(),
              name,
              avatar: clerkUser.imageUrl,
              role: isAdmin ? 'ADMIN' : 'CUSTOMER',
            },
            update: {
              role: isAdmin ? 'ADMIN' : undefined,
            },
          });

          // Sync with Clerk metadata to prevent redirection in AdminLayout
          if (isAdmin) {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
              publicMetadata: { role: 'ADMIN' }
            });
          }

          // If admin, ensure they have a vendor profile to upload products
          if (isAdmin) {
            await prisma.vendor.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                shopName: 'Deeshora Official',
                email: email.toLowerCase(),
                phone: '8939318865',
                city: 'Chennai',
                address: 'Deeshora HQ',
                category: 'Official',
                status: 'APPROVED',
              },
              update: {},
            });
          }
        }
      } catch (e) {
        // Non-fatal — protected routes will throw UNAUTHORIZED if user is null
        console.error('[tRPC] Failed to auto-create user:', e);
      }
    } else {
      // Logic for existing users who might have just been designated as admin
      const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
      if (isAdmin && user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });

        // Sync with Clerk metadata
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: { role: 'ADMIN' }
        });
        
        // Ensure vendor profile for existing user
        await prisma.vendor.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            shopName: 'Deeshora Official',
            email: user.email,
            phone: '8939318865',
            city: 'Chennai',
            address: 'Deeshora HQ',
            category: 'Official',
            status: 'APPROVED',
          },
          update: {},
        });
      }
    }
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