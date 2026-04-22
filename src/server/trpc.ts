// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import superjson from 'superjson';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';


// ─── C1: Admin emails from environment variable, NOT hard-coded ───────────────
// Set ADMIN_EMAILS="a@b.com,c@d.com" in your .env file
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);


export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();

  // ─── C2: Fast path — skip all DB work for unauthenticated requests ────────
  if (!userId) {
    return { prisma, userId: null, user: null, ...opts };
  }

  let user: User | null = null;

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
            // Only force-upgrade to ADMIN if email matches; never downgrade here
            role: isAdmin ? 'ADMIN' : undefined,
          },
        });

        // Sync Clerk metadata once on creation (not on every request)
        if (isAdmin) {
          try {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
              publicMetadata: { role: 'ADMIN' },
            });
          } catch (e) {
            console.error('[tRPC] Failed to sync Admin metadata on creation:', e);
          }

          // Ensure vendor profile for admin to manage official shop
          await prisma.vendor.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              shopName: 'Deeshora Official',
              email: email.toLowerCase(),
              phone: process.env.ADMIN_PHONE ?? '0000000000',
              city: 'Chennai',
              address: 'Deeshora HQ',
              categories: ['Official'],
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
    // ─── C2: Existing user — only write to DB/Clerk when role actually needs to change ──

    const isAdminByEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
    const isAdminByRole = user.role === 'ADMIN';
    const isAdmin = isAdminByEmail || isAdminByRole;

    if (isAdmin) {
      // Upgrade DB role if somehow not ADMIN yet
      if (user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }
    }
    // VENDOR and DELIVERY roles in DB are trusted as-is — no automatic changes
    // Promotion logic should be handled by webhooks or explicit sync buttons, 
    // not by checking Clerk on every request.
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
  const isVendor = ctx.user.role === 'VENDOR' || ctx.user.role === 'ADMIN';

  if (!isVendor) {
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
 * Delivery procedure
 */
export const deliveryProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'DELIVERY' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a delivery partner.' });
  }
  return next({ ctx });
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