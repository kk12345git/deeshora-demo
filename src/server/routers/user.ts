// src/server/routers/user.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

/** Check DB for serviceability — falls back to false if not found */
async function checkServiceable(prisma: any, area: string | null | undefined): Promise<boolean> {
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
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        addresses: { orderBy: { isDefault: 'desc' } },
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    return user;
  }),

  // Update profile fields (all optional — user can fill progressively)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional(),
        area: z.string().optional(),
        pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode').optional().or(z.literal('')),
        landmark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined)
      );
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data,
      });
      return updated;
    }),

  // Mark onboarding as complete
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name is required'),
        phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
        area: z.string().optional(),
        pincode: z.string().optional(),
        landmark: z.string().optional(),
      })
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
    if (!user) return { canOrder: false, reason: 'User not found' };
    if (!user.isOnboarded || !user.phone) {
      return { canOrder: false, reason: 'incomplete_profile' };
    }
    const serviceable = await checkServiceable(ctx.prisma, user.area);
    if (!serviceable) {
      return { canOrder: false, reason: 'outside_area', area: user.area };
    }
    return { canOrder: true, reason: null };
  }),
});
