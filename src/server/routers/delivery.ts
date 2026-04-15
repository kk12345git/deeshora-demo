import { z } from 'zod';
import { createTRPCRouter, deliveryProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { OrderStatus } from '@prisma/client';

export const deliveryRouter = createTRPCRouter({
  /** Get all orders that are READY for pickup but not yet assigned */
  getPool: deliveryProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: {
        status: 'READY',
        deliveryPartnerId: null,
      },
      include: {
        user: { select: { name: true, phone: true } },
        vendor: { select: { shopName: true, address: true, phone: true, city: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  /** Get orders currently assigned to the logged-in partner */
  getMyTasks: deliveryProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'OUT_FOR_DELIVERY',
      },
      include: {
        user: { select: { name: true, phone: true } },
        vendor: { select: { shopName: true, address: true, phone: true, city: true } },
        address: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }),

  /** Claim an order from the pool */
  claimOrder: deliveryProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      if (order.status !== 'READY') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order is not ready for pickup.' });
      if (order.deliveryPartnerId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order already claimed.' });

      return ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          deliveryPartnerId: ctx.user.id,
          status: 'OUT_FOR_DELIVERY',
          assignedAt: new Date(),
          timeline: {
            create: {
              status: 'OUT_FOR_DELIVERY',
              message: 'Order picked up by delivery partner.',
            },
          },
        },
      });
    }),

  /** Mark order as delivered and trigger completion logic */
  completeOrder: deliveryProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: { user: { select: { phone: true, name: true } }, vendor: { select: { shopName: true } } },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      if (order.deliveryPartnerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not the assigned partner.' });

      const updated = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          timeline: {
            create: {
              status: 'DELIVERED',
              message: 'Order delivered successfully.',
            },
          },
        },
      });

      // We return phone and message info so the frontend can trigger the WhatsApp redirect
      return {
        success: true,
        customerPhone: order.user.phone,
        customerName: order.user.name,
        shopName: order.vendor.shopName,
      };
    }),

  /** Get comprehensive stats for the partner profile */
  getStats: deliveryProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const completedToday = await ctx.prisma.order.count({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'DELIVERED',
        deliveredAt: { gte: today },
      },
    });

    const activeTasksCount = await ctx.prisma.order.count({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'OUT_FOR_DELIVERY',
      },
    });

    const lifetimeDeliveries = await ctx.prisma.order.count({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'DELIVERED',
      },
    });

    const earningsData = await ctx.prisma.order.aggregate({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'DELIVERED',
      },
      _sum: {
        deliveryFee: true,
      },
    });

    const todayEarningsData = await ctx.prisma.order.aggregate({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'DELIVERED',
        deliveredAt: { gte: today },
      },
      _sum: {
        deliveryFee: true,
      },
    });

    const weeklyEarningsData = await ctx.prisma.order.aggregate({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'DELIVERED',
        deliveredAt: { gte: weekStart },
      },
      _sum: {
        deliveryFee: true,
      },
    });

    return { 
      completedToday, 
      activeTasks: activeTasksCount,
      lifetimeDeliveries,
      totalEarnings: earningsData._sum.deliveryFee || 0,
      weeklyEarnings: weeklyEarningsData._sum.deliveryFee || 0,
      todayEarnings: todayEarningsData._sum.deliveryFee || 0,
    };
  }),

  /** Get recent earnings history */
  getEarningsHistory: deliveryProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: 'DELIVERED',
      },
      select: {
        id: true,
        deliveryFee: true,
        deliveredAt: true,
        vendor: { select: { shopName: true } },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 30,
    });
  }),

  /** Get full details for a specific order if assigned */
  getOrderDetails: deliveryProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: { select: { name: true, phone: true } },
          vendor: { select: { shopName: true, address: true, phone: true, city: true } },
          address: true,
          items: {
            select: {
              name: true,
              quantity: true,
              image: true,
            }
          }
        },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      
      // Allow access if it's in the pool (no partner) OR if assigned to current user
      const isAvailable = order.status === 'READY' && !order.deliveryPartnerId;
      const isAssignedToMe = order.deliveryPartnerId === ctx.user.id;

      if (!isAvailable && !isAssignedToMe) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not assigned to this order.' });
      }

      return order;
    }),
});
