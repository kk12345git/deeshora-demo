// src/server/routers/order.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, vendorProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { createRazorpayOrder, verifyRazorpaySignature } from '@/lib/razorpay';
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher';
import { OrderStatus } from '@prisma/client';


export const orderRouter = createTRPCRouter({
  createPaymentOrder: protectedProcedure
    .input(
      z.object({
        addressId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { addressId, notes } = input;


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
      }, {} as Record<string, { vendor: any; items: any[]; subtotal: number }>);


      const config = await ctx.prisma.siteConfig.findMany();
      const deliveryFeeConfig = config.find((c: any) => c.key === 'delivery_fee');
      const freeDeliveryConfig = config.find((c: any) => c.key === 'free_delivery_above');
      const baseDeliveryFee = deliveryFeeConfig ? parseFloat(deliveryFeeConfig.value) : 40;
      const freeDeliveryThreshold = freeDeliveryConfig ? parseFloat(freeDeliveryConfig.value) : 299;


      let grandTotal = 0;
      const createdOrders = [];


      for (const vendorId in itemsByVendor) {
        const { vendor, items, subtotal } = itemsByVendor[vendorId];
        const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
        const total = subtotal + deliveryFee;
        grandTotal += total;


        const commission = subtotal * vendor.commissionRate;
        const vendorAmount = subtotal - commission;


        const order = {
          userId: user.id,
          vendorId: vendor.id,
          addressId: address.id,
          subtotal,
          deliveryFee,
          total,
          commission,
          vendorAmount,
          notes,
          items: {
            create: items.map((item: any) => ({
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
              message: 'Order placed by customer.',
            },
          },
        };
        createdOrders.push(order);
      }


      const razorpayOrder = await createRazorpayOrder(grandTotal, `cart_${cart.id}`);


      const finalOrders = await ctx.prisma.$transaction(
        createdOrders.map(orderData =>
          ctx.prisma.order.create({
            data: { ...orderData, razorpayOrderId: razorpayOrder.id },
          })
        )
      );


      return {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        orderIds: finalOrders.map(o => o.id),
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      };
    }),


  verifyPayment: protectedProcedure
    .input(
      z.object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
        orderIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderIds } = input;


      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );


      if (!isValid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Razorpay signature.' });
      }


      const orders = await ctx.prisma.order.findMany({
        where: { id: { in: orderIds }, userId: ctx.user.id },
        include: { items: true, vendor: true },
      });


      if (orders.length !== orderIds.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Some orders were not found.' });
      }


      await ctx.prisma.$transaction(async (tx) => {
        // 1. Update orders
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            paymentId: razorpay_payment_id,
          },
        });


        // 2. Add timeline entries
        await tx.orderTimeline.createMany({
          data: orderIds.map(id => ({
            orderId: id,
            status: OrderStatus.CONFIRMED,
            message: 'Payment successful. Order confirmed.',
          })),
        });


        // 3. Update vendor payouts and product stock
        for (const order of orders) {
          await tx.vendor.update({
            where: { id: order.vendorId },
            data: { pendingPayout: { increment: order.vendorAmount } },
          });


          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
          
          // 4. Trigger Pusher event
          await pusherServer.trigger(
            CHANNELS.VENDOR(order.vendorId),
            EVENTS.NEW_ORDER,
            { orderId: order.id, customerName: ctx.user.name }
          );
        }


        // 5. Clear cart
        await tx.cartItem.deleteMany({ where: { cart: { userId: ctx.user.id } } });
      });


      return { success: true, orderIds };
    }),


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
          timeline: {
            create: {
              status,
              message: messages[status],
            },
          },
        },
      });


      // Trigger Pusher event
      await pusherServer.trigger(
        CHANNELS.ORDER(orderId),
        EVENTS.ORDER_STATUS_UPDATED,
        { status, message: messages[status] }
      );


      return updatedOrder;
    }),


  vendorStats: vendorProcedure.query(async ({ ctx }) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, todayOrders, pendingOrders, totalRevenue, last14DaysOrders, topItems] = await Promise.all([
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
        select: { createdAt: true, vendorAmount: true },
        orderBy: { createdAt: 'asc' },
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
    ]);

    const dailySeries = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayOrders = last14DaysOrders.filter(o => {
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
      topProducts: topItems.map(item => ({
        name: item.name,
        quantity: item._sum.quantity || 0,
        revenue: item._sum.total || 0
      }))
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