// src/server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import superjson from "superjson";
import prisma from "@/lib/prisma";
import { User, UserRole } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

// ─── C1: Admin emails from environment variable, NOT hard-coded ───────────────
// Set ADMIN_EMAILS="a@b.com,c@d.com" in your .env file
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const createTRPCContext = async (opts: { headers: Headers }) => {
  let userId: string | null = null;

  // E2E Test bypass: If secret matches, bypass Clerk auth check and inject simulated user
  let e2eSecret = opts.headers.get("x-e2e-secret");
  let e2eRole = opts.headers.get("x-e2e-role");

  if (!e2eSecret) {
    const cookieHeader = opts.headers.get("cookie") || "";
    const secretMatch = cookieHeader.match(/x-e2e-secret=([^;]+)/);
    if (secretMatch) {
      e2eSecret = decodeURIComponent(secretMatch[1]);
    }
    const roleMatch = cookieHeader.match(/x-e2e-role=([^;]+)/);
    if (roleMatch) {
      e2eRole = decodeURIComponent(roleMatch[1]);
    }
  }

  if (e2eSecret && e2eSecret === process.env.CRON_SECRET) {
    const role = e2eRole || "ADMIN";
    const e2eUser = await prisma.user.findFirst({
      where: { role: role as any },
    });
    if (e2eUser) {
      userId = e2eUser.clerkId;
    }
  }

  if (!userId) {
    const authResult = await auth();
    userId = authResult.userId;
  }

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
        const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
        const firstName = clerkUser.firstName ?? "";
        const lastName = clerkUser.lastName ?? "";
        const name = `${firstName} ${lastName}`.trim() || email.split("@")[0];

        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        user = await prisma.user.upsert({
          where: { clerkId: userId },
          create: {
            clerkId: userId,
            email: email.toLowerCase(),
            name,
            avatar: clerkUser.imageUrl,
            role: isAdmin ? "ADMIN" : "CUSTOMER",
          },
          update: {
            // Only force-upgrade to ADMIN if email matches; never downgrade here
            role: isAdmin ? "ADMIN" : undefined,
          },
        });

        // Sync Clerk metadata once on creation (not on every request)
        if (isAdmin) {
          try {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
              publicMetadata: { role: "ADMIN" },
            });
          } catch (e) {
            console.error(
              "[tRPC] Failed to sync Admin metadata on creation:",
              e,
            );
          }

          // Vendor creation removed
        }
      }
    } catch (e) {
      // Non-fatal — protected routes will throw UNAUTHORIZED if user is null
      console.error("[tRPC] Failed to auto-create user:", e);
    }
  } else {
    // ─── C2: Existing user — only write to DB/Clerk when role actually needs to change ──

    const isAdminByEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
    const isAdminByRole = user.role === "ADMIN";
    const isAdmin = isAdminByEmail || isAdminByRole;

    if (isAdmin) {
      // 1. Upgrade DB role if somehow not ADMIN yet
      if (user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }

      // 2. Sync Clerk metadata if missing or wrong
      const isE2E = opts.headers.get("x-e2e-secret") === process.env.CRON_SECRET;
      if (!isE2E) {
        const { sessionClaims } = await auth();
        if ((sessionClaims?.metadata as any)?.role !== "ADMIN") {
          try {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
              publicMetadata: { role: "ADMIN" },
            });
            console.log(`[tRPC] Synced ADMIN role to Clerk for ${user.email}`);
          } catch (e) {
            console.error(
              "[tRPC] Failed to sync Clerk metadata for existing admin:",
              e,
            );
          }
        }
      }
    } else if (user.role === "DELIVERY_PARTNER") {
      // Sync DELIVERY_PARTNER role to Clerk
      const isE2E = opts.headers.get("x-e2e-secret") === process.env.CRON_SECRET;
      if (!isE2E) {
        const { sessionClaims } = await auth();
        if ((sessionClaims?.metadata as any)?.role !== "DELIVERY_PARTNER") {
          try {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
              publicMetadata: { role: "DELIVERY_PARTNER" },
            });
            console.log(
              `[tRPC] Synced DELIVERY_PARTNER role to Clerk for ${user.email}`,
            );
          } catch (e) {
            console.error(
              "[tRPC] Failed to sync Clerk metadata for delivery partner:",
              e,
            );
          }
        }
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
    throw new TRPCError({ code: "UNAUTHORIZED" });
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
 * Delivery procedure
 */
export const deliveryProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (
      ctx.user.role !== UserRole.DELIVERY_PARTNER &&
      ctx.user.role !== UserRole.ADMIN
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a delivery partner.",
      });
    }
    return next({ ctx });
  },
);

/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not an admin.",
    });
  }
  return next({ ctx });
});

/**
 * Vendor procedure
 */
export const vendorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "VENDOR" && ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a vendor.",
    });
  }
  return next({ ctx });
});
