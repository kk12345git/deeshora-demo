// src/server/routers/coupon.ts
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { DiscountType } from '@prisma/client';

export const couponRouter = createTRPCRouter({
  /** Public: validate a coupon code against a cart total */
  validate: publicProcedure
    .input(z.object({ code: z.string().trim().toUpperCase(), cartTotal: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const coupon = await ctx.prisma.coupon.findUnique({
        where: { code: input.code },
      });

      if (!coupon || !coupon.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coupon code not found or expired.' });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This coupon has expired.' });
      }

      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This coupon has reached its usage limit.' });
      }

      if (input.cartTotal < coupon.minOrder) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum order of ₹${coupon.minOrder.toFixed(0)} required for this coupon.`,
        });
      }

      // Calculate discount
      const discount =
        coupon.type === DiscountType.FIXED
          ? Math.min(coupon.value, input.cartTotal)
          : Math.round((input.cartTotal * coupon.value) / 100);

      return {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        description:
          coupon.type === DiscountType.FIXED
            ? `₹${coupon.value} off your order`
            : `${coupon.value}% off your order`,
      };
    }),

  /** Admin: list all coupons */
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });
  }),

  /** Admin: create a coupon */
  create: adminProcedure
    .input(
      z.object({
        code: z.string().trim().toUpperCase().min(3).max(20),
        type: z.nativeEnum(DiscountType),
        value: z.number().positive(),
        minOrder: z.number().min(0).default(0),
        maxUses: z.number().int().min(0).default(0),
        expiresAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.coupon.findUnique({ where: { code: input.code } });
      if (exists) throw new TRPCError({ code: 'CONFLICT', message: 'Coupon code already exists.' });

      return ctx.prisma.coupon.create({
        data: {
          ...input,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
      });
    }),

  /** Admin: toggle active status */
  toggle: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.coupon.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  /** Admin: delete a coupon */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.coupon.delete({ where: { id: input.id } });
    }),
});
