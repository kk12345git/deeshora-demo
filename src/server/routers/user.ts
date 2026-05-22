// src/server/routers/user.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { uploadImage } from "@/lib/cloudinary";
import { clerkClient } from "@clerk/nextjs/server";

/** Check DB for serviceability — falls back to false if not found */
async function checkServiceable(
  prisma: any,
  area: string | null | undefined,
): Promise<boolean> {
  if (!area) return false;
  const count = await prisma.serviceArea.count({
    where: {
      value: area,
      isServiceable: true,
      isActive: true,
    },
  });
  return count > 0;
}

export const userRouter = createTRPCRouter({
  // Fetch the current logged-in user's full profile
  me: protectedProcedure.query(async ({ ctx }) => {
    let user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        addresses: { orderBy: { isDefault: "desc" } },
        referredBy: { select: { name: true } },
        referrals: {
          take: 10,
          select: { id: true, name: true, createdAt: true },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            paymentStatus: true,
            items: { take: 1, select: { image: true, name: true } },
          },
        },
        _count: { select: { orders: true, reviews: true, referrals: true } },
      },
    });

    if (!user)
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    // Check if subscription has expired
    if (user.subscriptionStatus === "ACTIVE" && user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
      if (user.subscriptionAutopay && user.walletBalance >= 29) {
        // Auto-renew!
        await ctx.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: ctx.user.id },
            data: {
              walletBalance: { decrement: 29 },
              subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
          await tx.walletTransaction.create({
            data: {
              userId: ctx.user.id,
              amount: -29,
              type: "PAYMENT",
              status: "COMPLETED",
              description: "Auto-renewal of VIP Membership Subscription",
            },
          });
        });
        
        // Re-fetch user with all relations
        user = await ctx.prisma.user.findUnique({
          where: { id: ctx.user.id },
          include: {
            addresses: { orderBy: { isDefault: "desc" } },
            referredBy: { select: { name: true } },
            referrals: {
              take: 10,
              select: { id: true, name: true, createdAt: true },
            },
            orders: {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                paymentStatus: true,
                items: { take: 1, select: { image: true, name: true } },
              },
            },
            _count: { select: { orders: true, reviews: true, referrals: true } },
          },
        });
        if (!user)
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      } else {
        // Expiration without autopay or insufficient balance
        user = await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            subscriptionStatus: "NONE",
            subscriptionExpiresAt: null,
            subscriptionUtr: null,
          },
          include: {
            addresses: { orderBy: { isDefault: "desc" } },
            referredBy: { select: { name: true } },
            referrals: {
              take: 10,
              select: { id: true, name: true, createdAt: true },
            },
            orders: {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                paymentStatus: true,
                items: { take: 1, select: { image: true, name: true } },
              },
            },
            _count: { select: { orders: true, reviews: true, referrals: true } },
          },
        });
      }
    }

    if (!user)
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    // Auto-generate referral code if missing — with collision-safe retry loop
    if (!user.referralCode) {
      let code: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = (
          ctx.user.id.slice(0, 3) + Math.random().toString(36).substring(2, 7)
        ).toUpperCase();
        const existing = await ctx.prisma.user.findUnique({
          where: { referralCode: candidate },
        });
        if (!existing) {
          code = candidate;
          break;
        }
      }
      if (code) {
        user = await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: { referralCode: code },
          include: {
            addresses: { orderBy: { isDefault: "desc" } },
            referredBy: { select: { name: true } },
            referrals: {
              take: 10,
              select: { id: true, name: true, createdAt: true },
            },
            orders: {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                paymentStatus: true,
                items: { take: 1, select: { image: true, name: true } },
              },
            },
            _count: {
              select: { orders: true, reviews: true, referrals: true },
            },
          },
        });
      }
    }

    return user;
  }),

  // Update profile fields (all optional — user can fill progressively)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phone: z
          .string()
          .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
          .optional(),
        area: z.string().optional(),
        pincode: z
          .string()
          .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
          .optional()
          .or(z.literal("")),
        landmark: z.string().optional(),
        avatar: z.string().startsWith("data:image/").optional(),
        gender: z.string().optional(),
        occupation: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let avatarUrl: string | undefined = undefined;
      if (input.avatar) {
        avatarUrl = await uploadImage(input.avatar, "users/avatars");
      }

      const data = {
        ...input,
        avatar: avatarUrl ?? undefined,
      };

      // Filter out undefined values to satisfy Prisma
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      );

      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: filteredData,
      });
      return updated;
    }),

  // Mark onboarding as complete
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name is required"),
        phone: z
          .string()
          .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
        area: z.string().optional(),
        pincode: z.string().optional(),
        landmark: z.string().optional(),
        gender: z.string().optional(),
        occupation: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          name: input.name,
          phone: input.phone,
          area: input.area,
          pincode: input.pincode,
          landmark: input.landmark,
          gender: input.gender,
          occupation: input.occupation,
          isOnboarded: true,
        },
      });
      const isServiceable = await checkServiceable(ctx.prisma, input.area);
      return { user: updated, isServiceable };
    }),

  // Quick check: can this user place an order?
  canOrder: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { isOnboarded: true, area: true, phone: true },
    });
    if (!user) return { canOrder: false, reason: "User not found" };
    if (!user.isOnboarded || !user.phone) {
      return { canOrder: false, reason: "incomplete_profile" };
    }
    const serviceable = await checkServiceable(ctx.prisma, user.area);
    if (!serviceable) {
      return { canOrder: false, reason: "outside_area", area: user.area };
    }
    return { canOrder: true, reason: null };
  }),

  // ─── Address Management (Moved from vendor) ─────────────────────────

  myAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.address.findMany({
      where: { userId: ctx.user.id },
      orderBy: { isDefault: "desc" },
    });
  }),

  addAddress: protectedProcedure
    .input(
      z.object({
        label: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        pincode: z.string(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isDefault) {
        await ctx.prisma.address.updateMany({
          where: { userId: ctx.user.id },
          data: { isDefault: false },
        });
      }
      return ctx.prisma.address.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),

  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const address = await ctx.prisma.address.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found.",
        });
      }
      await ctx.prisma.address.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ─── Referral Logic ──────────────────────────────────────────────────

  applyReferralCode: protectedProcedure
    .input(z.object({ code: z.string().toUpperCase() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
      });

      if (currentUser?.referredById) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already been referred.",
        });
      }

      const referrer = await ctx.prisma.user.findUnique({
        where: { referralCode: input.code },
      });

      if (!referrer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid referral code.",
        });
      }

      if (referrer.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot refer yourself.",
        });
      }

      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { referredById: referrer.id },
      });
    }),

  // ─── Notifications ──────────────────────────────────────────────────

  myNotifications: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { id: input.id, userId: ctx.user.id },
        data: { isRead: true },
      });
    }),

  setRole: protectedProcedure
    .input(
      z.object({
        role: z.enum(["CUSTOMER", "DELIVERY_PARTNER"]),
        gender: z.string().optional(),
        occupation: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          role: input.role,
          gender: input.gender,
          occupation: input.occupation,
          isOnboarded: input.role === "CUSTOMER" ? true : false,
        },
      });

      // Sync to Clerk metadata for faster frontend checks
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(ctx.userId, {
          publicMetadata: { role: input.role },
        });
      } catch (e) {
        console.error("[UserRouter] Failed to sync role to Clerk:", e);
      }

      return updated;
    }),

  toggleAutopay: protectedProcedure
    .input(z.object({ autopay: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { subscriptionAutopay: input.autopay },
      });
    }),

  buyMembershipWithWallet: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: ctx.user.id },
        select: { walletBalance: true, subscriptionStatus: true },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (user.walletBalance < 29) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance. Please recharge your wallet." });
      }
      
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const updatedUser = await tx.user.update({
        where: { id: ctx.user.id },
        data: {
          walletBalance: { decrement: 29 },
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: expiresAt,
          subscriptionUtr: null,
        },
      });
      
      await tx.walletTransaction.create({
        data: {
          userId: ctx.user.id,
          amount: -29,
          type: "PAYMENT",
          status: "COMPLETED",
          description: "VIP Membership Subscription Purchase (Wallet)",
        },
      });
      
      return updatedUser;
    });
  }),

  submitMembershipManualPayment: protectedProcedure
    .input(
      z.object({
        utr: z
          .string()
          .length(12, "UTR must be exactly 12 digits")
          .regex(/^\d+$/, "UTR must contain only numbers"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUtr = await ctx.prisma.user.findFirst({
        where: { subscriptionUtr: input.utr },
      });
      if (existingUtr) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This UTR number has already been submitted.",
        });
      }
      
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          subscriptionStatus: "PENDING",
          subscriptionUtr: input.utr,
        },
      });
    }),
});
