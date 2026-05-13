import { z } from "zod";
import { createTRPCRouter, deliveryProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { OrderStatus } from "@prisma/client";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

export const deliveryRouter = createTRPCRouter({
  /** Get all orders that are READY for pickup but not yet assigned */
  getPool: deliveryProcedure.query(async ({ ctx }) => {
    // Only return pool if the current delivery partner is online
    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { isDeliveryOnline: true },
    });

    if (!currentUser?.isDeliveryOnline) {
      return [];
    }

    return ctx.prisma.order.findMany({
      where: {
        status: "READY",
        deliveryPartnerId: null,
      },
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Get orders currently assigned to the logged-in partner */
  getMyTasks: deliveryProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "OUT_FOR_DELIVERY",
      },
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }),

  /** Claim an order from the pool */
  claimOrder: deliveryProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      if (order.status !== "READY")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order is not ready for pickup.",
        });
      if (order.deliveryPartnerId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order already claimed.",
        });

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { isDeliveryOnline: true },
      });

      if (!user?.isDeliveryOnline) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must be online to claim orders.",
        });
      }

      const updatedOrder = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          deliveryPartnerId: ctx.user.id,
          status: "OUT_FOR_DELIVERY",
          assignedAt: new Date(),
          timeline: {
            create: {
              status: "OUT_FOR_DELIVERY",
              message: "Order picked up by delivery partner.",
            },
          },
        },
        include: {
          deliveryPartner: { select: { name: true, phone: true } },
        },
      });

      // Trigger Pusher for real-time customer tracking update
      try {
        await pusherServer.trigger(
          CHANNELS.ORDER(input.orderId),
          EVENTS.ORDER_STATUS_UPDATED,
          {
            status: "OUT_FOR_DELIVERY",
            message: "Order picked up by delivery partner.",
            deliveryPartner: updatedOrder.deliveryPartner,
          },
        );
      } catch (err) {
        console.error("[Delivery] Pusher claim notify failed:", err);
      }

      return updatedOrder;
    }),

  /** Mark order as delivered and trigger completion logic */
  completeOrder: deliveryProcedure
    .input(
      z.object({
        orderId: z.string(),
        verificationCode: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: { user: { select: { phone: true, name: true } } },
      });

      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      // If verification code is provided, check if it's the Metro-style pass
      if (
        input.verificationCode &&
        input.verificationCode !== `VERIFY_DELIVERY_${input.orderId}`
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Verification QR code.",
        });
      }

      if (order.deliveryPartnerId !== ctx.user.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the assigned partner.",
        });

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: input.orderId },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            // H3: Mark COD as PAID when delivery partner confirms delivery
            paymentStatus:
              order.paymentMethod === "COD" ? "PAID" : order.paymentStatus,
            timeline: {
              create: {
                status: "DELIVERED",
                message: "Order delivered successfully.",
              },
            },
          },
        });

        return updatedOrder;
      });

      // Return phone and message info so the frontend can trigger the WhatsApp redirect
      return {
        success: true,
        customerPhone: order.user.phone,
        customerName: order.user.name,
        shopName: "Deeshora",
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
        status: "DELIVERED",
        deliveredAt: { gte: today },
      },
    });

    const activeTasksCount = await ctx.prisma.order.count({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "OUT_FOR_DELIVERY",
      },
    });

    const lifetimeDeliveries = await ctx.prisma.order.count({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "DELIVERED",
      },
    });

    const earningsData = await ctx.prisma.order.aggregate({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "DELIVERED",
      },
      _sum: {
        deliveryFee: true,
      },
    });

    const todayEarningsData = await ctx.prisma.order.aggregate({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "DELIVERED",
        deliveredAt: { gte: today },
      },
      _sum: {
        deliveryFee: true,
      },
    });

    const weeklyEarningsData = await ctx.prisma.order.aggregate({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "DELIVERED",
        deliveredAt: { gte: weekStart },
      },
      _sum: {
        deliveryFee: true,
      },
    });

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { isDeliveryOnline: true },
    });

    return {
      completedToday,
      activeTasks: activeTasksCount,
      lifetimeDeliveries,
      totalEarnings: earningsData._sum.deliveryFee || 0,
      weeklyEarnings: weeklyEarningsData._sum.deliveryFee || 0,
      todayEarnings: todayEarningsData._sum.deliveryFee || 0,
      isOnline: user?.isDeliveryOnline || false,
    };
  }),

  /** Get recent earnings history */
  getEarningsHistory: deliveryProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: {
        deliveryPartnerId: ctx.user.id,
        status: "DELIVERED",
      },
      select: {
        id: true,
        deliveryFee: true,
        deliveredAt: true,
      },
      orderBy: { deliveredAt: "desc" },
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
          address: true,
          items: {
            select: {
              name: true,
              quantity: true,
              image: true,
            },
          },
        },
      });

      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      // Allow access if it's in the pool (no partner) OR if assigned to current user
      const isAvailable = order.status === "READY" && !order.deliveryPartnerId;
      const isAssignedToMe = order.deliveryPartnerId === ctx.user.id;

      if (!isAvailable && !isAssignedToMe) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this order.",
        });
      }

      return order;
    }),

  /** Toggle driver online/offline status */
  toggleStatus: deliveryProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user)
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });

    return ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { isDeliveryOnline: !user.isDeliveryOnline },
    });
  }),
});
