// src/server/routers/order.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, vendorProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher';
import { OrderStatus } from '@prisma/client';


export const orderRouter = createTRPCRouter({
  placeOrder: protectedProcedure
    .input(
      z.object({
        addressId: z.string(),
        notes: z.string().optional(),
        paymentMethod: z.enum(['COD', 'UPI']).default('COD'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { addressId, notes, paymentMethod } = input;

      const address = await ctx.prisma.address.findFirst({
        where: { id: addressId, userId: user.id },
      });
      if (!address) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Address not found.' });
      }

      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: { vendor: true },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Your cart is empty.' });
      }

      // Validate all items are still active and vendor is approved
      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `"${item.product.name}" is no longer available.`,
          });
        }
        if (item.product.vendor.status !== 'APPROVED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Vendor for "${item.product.name}" is not active.`,
          });
        }
        if (item.product.stock < item.quantity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `"${item.product.name}" has insufficient stock (only ${item.product.stock} left).`,
          });
        }
      }

      // Group items by vendor
      const itemsByVendor = cart.items.reduce((acc, item) => {
        const vendorId = item.product.vendorId;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendor: item.product.vendor,
            items: [],
            subtotal: 0,
          };
        }
        acc[vendorId].items.push(item);
        acc[vendorId].subtotal += item.product.price * item.quantity;
        return acc;
      }, {} as Record<string, { vendor: typeof cart.items[0]['product']['vendor']; items: typeof cart.items; subtotal: number }>);

      const config = await ctx.prisma.siteConfig.findMany();
      const deliveryFeeConfig = config.find((c) => c.key === 'delivery_fee');
      const freeDeliveryConfig = config.find((c) => c.key === 'free_delivery_above');
      const baseDeliveryFee = deliveryFeeConfig ? parseFloat(deliveryFeeConfig.value) : 40;
      const freeDeliveryThreshold = freeDeliveryConfig ? parseFloat(freeDeliveryConfig.value) : 299;

      const finalOrders = await ctx.prisma.$transaction(async (tx) => {
        const createdOrders = [];

        for (const vendorId in itemsByVendor) {
          const { vendor, items, subtotal } = itemsByVendor[vendorId];
          const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
          const total = subtotal + deliveryFee;

          const commission = subtotal * vendor.commissionRate;
          const vendorAmount = subtotal - commission;

          const order = await tx.order.create({
            data: {
              userId: user.id,
              vendorId: vendor.id,
              addressId: address.id,
              subtotal,
              deliveryFee,
              total,
              commission,
              vendorAmount,
              notes,
              paymentMethod,
              // L1: Fixed dead ternary — COD orders start PENDING until delivered
              paymentStatus: 'PENDING',
              status: OrderStatus.PENDING,
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  name: item.product.name,
                  image: item.product.images[0],
                  price: item.product.price,
                  mrp: item.product.mrp,
                  quantity: item.quantity,
                  total: item.product.price * item.quantity,
                  gstRate: item.product.gstRate ?? 0,
                  gstAmount: (item.product.price * item.quantity) * (item.product.gstRate ?? 0),
                })),
              },
              timeline: {
                create: {
                  status: OrderStatus.PENDING,
                  message: paymentMethod === 'COD' ? 'Order placed via Cash on Delivery.' : 'Order placed via UPI Payment.',
                },
              },
            },
          });

          // C5: Atomic stock decrement — only decrements if stock >= quantity
          // Prevents race conditions where two orders consume the same last unit
          for (const item of items) {
            const updated = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });

            if (updated.count === 0) {
              // Race condition detected — another order grabbed the last stock
              throw new TRPCError({
                code: 'CONFLICT',
                message: `"${item.product.name}" just ran out of stock. Please remove it from your cart and try again.`,
              });
            }
          }

          // M3: Pusher wrapped in try/catch — order is NOT rolled back if notification fails
          try {
            await pusherServer.trigger(
              CHANNELS.VENDOR(vendor.id),
              EVENTS.NEW_ORDER,
              { orderId: order.id, customerName: user.name }
            );
          } catch (pusherErr) {
            console.error('[Order] Pusher notify failed for vendor:', vendor.id, pusherErr);
            // Non-fatal — vendor will see order on next refresh
          }

          createdOrders.push(order);
        }

        // Clear cart after all orders are created
        await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });

        return createdOrders;
      });

      return {
        success: true,
        orderIds: finalOrders.map((o) => o.id),
        paymentMethod,
      };
    }),

  // C3: UPI self-confirmation endpoint REMOVED.
  // Reason: there is no server-side verification — customers could mark any order as paid.
  // Re-add only with a proper payment gateway signature check.

  myOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { userId: ctx.user.id },
        include: {
          vendor: { select: { shopName: true, logo: true } },
          items: { take: 1, select: { image: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });


      let nextCursor: typeof cursor | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem!.id;
      }
      return { orders, nextCursor };
    }),


  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          vendor: true,
          address: true,
          items: { include: { product: { select: { slug: true } } } },
          timeline: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      }
      return order;
    }),


  vendorOrders: vendorProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).nullish(),
        cursor: z.string().nullish(),
        status: z.nativeEnum(OrderStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor, status } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { vendorId: ctx.vendor.id, status: status },
        include: {
          user: { select: { name: true, phone: true } },
          address: true,
          items: true,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });


      let nextCursor: typeof cursor | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem!.id;
      }
      return { orders, nextCursor };
    }),


  updateStatus: vendorProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.nativeEnum(OrderStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, status } = input;
      const order = await ctx.prisma.order.findFirst({
        where: { id: orderId, vendorId: ctx.vendor.id },
      });


      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      }


      // Status transition validation
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING'],
        PREPARING: ['READY'],
        READY: ['OUT_FOR_DELIVERY'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
        REFUNDED: [],
      };


      if (!validTransitions[order.status].includes(status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Invalid status transition from ${order.status} to ${status}.` });
      }


      const messages: Record<OrderStatus, string> = {
        CONFIRMED: 'Vendor has confirmed your order.',
        PREPARING: 'Your order is being prepared.',
        READY: 'Your order is ready for pickup.',
        OUT_FOR_DELIVERY: 'Your order is out for delivery.',
        DELIVERED: 'Your order has been delivered.',
        CANCELLED: 'Your order has been cancelled by the vendor.',
        PENDING: '',
        REFUNDED: '',
      };


      const updatedOrder = await ctx.prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          // Mark COD as PAID when delivered
          paymentStatus: status === 'DELIVERED' && order.paymentMethod === 'COD' ? 'PAID' : order.paymentStatus,
          timeline: {
            create: {
              status,
              message: messages[status],
            },
          },
        },
      });


      // M3: Pusher in try/catch
      try {
        await pusherServer.trigger(
          CHANNELS.ORDER(orderId),
          EVENTS.ORDER_STATUS_UPDATED,
          { status, message: messages[status] }
        );
      } catch (pusherErr) {
        console.error('[Order] Pusher status update failed:', orderId, pusherErr);
      }


      return updatedOrder;
    }),


  vendorStats: vendorProcedure.query(async ({ ctx }) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    twentyEightDaysAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      stats,
      todayOrders,
      pendingOrders,
      totalRevenue,
      last14DaysOrders,
      previous14DaysOrders,
      topItems,
      allTimeOrders
    ] = await Promise.all([
      ctx.prisma.order.aggregate({
        where: { vendorId: ctx.vendor.id },
        _count: { id: true },
      }),
      ctx.prisma.order.count({
        where: { vendorId: ctx.vendor.id, createdAt: { gte: today } },
      }),
      ctx.prisma.order.count({
        where: {
          vendorId: ctx.vendor.id,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
        },
      }),
      ctx.prisma.order.aggregate({
        where: { vendorId: ctx.vendor.id, paymentStatus: 'PAID' },
        _sum: { vendorAmount: true },
      }),
      ctx.prisma.order.findMany({
        where: {
          vendorId: ctx.vendor.id,
          paymentStatus: 'PAID',
          createdAt: { gte: fourteenDaysAgo },
        },
        select: { createdAt: true, vendorAmount: true, deliveredAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      ctx.prisma.order.aggregate({
        where: {
          vendorId: ctx.vendor.id,
          paymentStatus: 'PAID',
          createdAt: { gte: twentyEightDaysAgo, lt: fourteenDaysAgo },
        },
        _sum: { vendorAmount: true },
      }),
      ctx.prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        where: {
          order: {
            vendorId: ctx.vendor.id,
            paymentStatus: 'PAID',
            createdAt: { gte: fourteenDaysAgo }
          }
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      ctx.prisma.order.findMany({
        where: { vendorId: ctx.vendor.id, paymentStatus: 'PAID' },
        select: { userId: true },
      }),
    ]);

    // 1. Calculate Growth
    const currentRevenue = last14DaysOrders.reduce((s, o) => s + o.vendorAmount, 0);
    const previousRevenue = previous14DaysOrders._sum.vendorAmount ?? 0;
    const growthRate = previousRevenue === 0 ? 100 : Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);

    // 2. Calculate average fulfillment speed (minutes)
    const deliveredOrders = last14DaysOrders.filter((o) => o.deliveredAt);
    const avgFulfillmentMinutes = deliveredOrders.length > 0
      ? Math.round(
          deliveredOrders.reduce((acc, current) => {
            return acc + (current.deliveredAt!.getTime() - current.createdAt.getTime());
          }, 0) / (deliveredOrders.length * 60000)
        )
      : 0;

    // 3. Calculate Retention
    const userOrderCounts: Record<string, number> = {};
    allTimeOrders.forEach((o) => {
      userOrderCounts[o.userId] = (userOrderCounts[o.userId] || 0) + 1;
    });
    const uniqueUsers = Object.keys(userOrderCounts).length;
    const repeatUsers = Object.values(userOrderCounts).filter((count) => count > 1).length;
    const retentionRate = uniqueUsers === 0 ? 0 : Math.round((repeatUsers / uniqueUsers) * 100);

    // 4. Calculate SEO Readiness Score
    let seoScore = 0;
    if (ctx.vendor.logo) seoScore += 25;
    if (ctx.vendor.coverImage) seoScore += 25;
    if (ctx.vendor.description && ctx.vendor.description.length > 50) seoScore += 25;
    const productsCount = await ctx.prisma.product.count({ where: { vendorId: ctx.vendor.id, isActive: true } });
    if (productsCount >= 5) seoScore += 25;

    const dailySeries = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayOrders = last14DaysOrders.filter((o) => {
        const t = new Date(o.createdAt);
        return t >= d && t < nextD;
      });
      return {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + o.vendorAmount, 0),
        orders: dayOrders.length,
      };
    });

    return {
      totalOrders: stats._count.id,
      todayOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.vendorAmount ?? 0,
      pendingPayout: ctx.vendor.pendingPayout,
      dailySeries,
      topProducts: topItems.map((item) => ({
        name: item.name,
        quantity: item._sum.quantity || 0,
        revenue: item._sum.total || 0
      })),
      // Elite Analytics
      growthRate,
      avgFulfillmentMinutes,
      retentionRate,
      seoScore
    };
  }),


  /** Invoice data — accessible by the customer who placed it OR the vendor */
  invoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.user.id },
            { vendor: { userId: ctx.user.id } },
          ],
        },
        include: {
          vendor: { select: { shopName: true, phone: true, email: true, address: true, city: true, logo: true, gstNumber: true, bankAccount: true, bankName: true, ifscCode: true } },
          address: true,
          user: { select: { name: true, phone: true, email: true } },
          items: true,
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      return order;
    }),


  /** Vendor side: get orders for invoicing/records */
  vendorOrdersList: vendorProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { vendorId: ctx.vendor.id, paymentStatus: 'PAID' },
        include: {
          items: true,
          user: { select: { name: true, phone: true, email: true } },
          vendor: { select: { shopName: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem!.id;
      }
      return { orders, nextCursor };
    }),

  vendorOrderById: vendorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: { id: input.id, vendorId: ctx.vendor.id },
        include: {
          items: true,
          user: { select: { name: true, email: true, phone: true } },
          address: true,
          vendor: true,
        },
      });
      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      }
      return order;
    }),
});