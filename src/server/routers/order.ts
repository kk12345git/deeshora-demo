// src/server/routers/order.ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  vendorProcedure,
} from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { OrderStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";

import { initiatePayment } from "@/lib/payments";

export const orderRouter = createTRPCRouter({
  placeOrder: protectedProcedure
    .input(
      z.object({
        addressId: z.string(),
        notes: z.string().optional(),
        paymentMethod: z
          .enum(["COD", "UPI", "PHONEPE", "MANUAL_UPI", "WALLET"])
          .default("COD"),
        deliverySlotId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { addressId, notes, paymentMethod } = input;

      const address = await ctx.prisma.address.findFirst({
        where: { id: addressId, userId: user.id },
      });
      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found.",
        });
      }

      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your cart is empty.",
        });
      }

      // Validate all items are still active
      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `"${item.product.name}" is no longer available.`,
          });
        }
        if (item.product.stock < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `"${item.product.name}" has insufficient stock (only ${item.product.stock} left).`,
          });
        }
      }

      const subtotal = cart.items.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0,
      );

      const config = await ctx.prisma.siteConfig.findMany();
      const deliveryFeeConfig = config.find((c) => c.key === "delivery_fee");
      const freeDeliveryConfig = config.find(
        (c) => c.key === "free_delivery_above",
      );

      const baseDeliveryFee = deliveryFeeConfig
        ? parseFloat(deliveryFeeConfig.value)
        : 40;
      const freeDeliveryThreshold = freeDeliveryConfig
        ? parseFloat(freeDeliveryConfig.value)
        : 299;

      const deliveryFee =
        subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
      const total = subtotal + deliveryFee;

      const itemsToCreate = cart.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        image: item.product.images[0],
        price: item.product.price,
        mrp: item.product.mrp,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
        gstRate: item.product.gstRate ?? 0,
        gstAmount:
          (item.product.price * item.quantity * (item.product.gstRate ?? 0)) /
          100,
      }));

      const pusherEventsToTrigger: Array<() => Promise<void>> = [];

      const order = await ctx.prisma.$transaction(async (tx) => {
        const firstVendorId = cart.items[0]?.product.vendorId;

        const orderRecord = await tx.order.create({
          data: {
            userId: user.id,
            addressId: address.id,
            subtotal,
            deliveryFee,
            total,
            notes,
            paymentMethod,
            paymentStatus: paymentMethod === "WALLET" ? "PAID" : "PENDING",
            deliverySlotId: input.deliverySlotId,
            status: OrderStatus.PENDING,
            vendorId: firstVendorId,
            platformFee: 0,
            vendorAmount: subtotal,
            items: {
              create: itemsToCreate,
            },
            timeline: {
              create: {
                status: OrderStatus.PENDING,
                message:
                  paymentMethod === "COD"
                    ? "Order placed via Cash on Delivery."
                    : paymentMethod === "WALLET"
                      ? "Order placed using Wallet balance."
                      : "Order placed via UPI Payment.",
              },
            },
          },
        });

        // Handle Wallet payment
        if (paymentMethod === "WALLET") {
          const userWithWallet = await tx.user.findUnique({
            where: { id: user.id },
            select: { walletBalance: true },
          });

          if (!userWithWallet || userWithWallet.walletBalance < total) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Insufficient wallet balance.",
            });
          }

          // Deduct from wallet
          await tx.user.update({
            where: { id: user.id },
            data: { walletBalance: { decrement: total } },
          });

          // Log wallet transaction
          await tx.walletTransaction.create({
            data: {
              userId: user.id,
              amount: -total,
              type: "PAYMENT",
              status: "COMPLETED",
              description: `Order payment for #${orderRecord.id.slice(-6)}`,
              reference: orderRecord.id,
            },
          });
        }

        for (const item of cart.items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (updated.count === 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `"${item.product.name}" just ran out of stock. Please remove it from your cart and try again.`,
            });
          }

          const productAfterUpdate = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              stock: true,
              lowStockThreshold: true,
              name: true,
            },
          });

          if (
            productAfterUpdate &&
            productAfterUpdate.stock <= productAfterUpdate.lowStockThreshold
          ) {
            // Notify Admin
            pusherEventsToTrigger.push(async () => {
              try {
                await pusherServer.trigger(
                  CHANNELS.ADMIN,
                  EVENTS.LOW_STOCK_ALERT,
                  {
                    productId: item.productId,
                    stock: productAfterUpdate.stock,
                    name: productAfterUpdate.name,
                  },
                );
              } catch (pusherErr) {
                console.error(
                  "[Order] Pusher low stock alert failed:",
                  pusherErr,
                );
              }
            });
          }
        }

        pusherEventsToTrigger.push(async () => {
          try {
            await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_ORDER, {
              orderId: orderRecord.id,
              customerName: user.name,
            });
          } catch (pusherErr) {
            console.error("[Order] Pusher notify failed for admin:", pusherErr);
          }
        });

        await logActivity({
          type: "ORDER",
          action: "CREATE",
          entityId: orderRecord.id,
          entityType: "Order",
          actorId: user.id,
          actorName: user.name,
          message: `User ${user.name} placed a new order #${orderRecord.id.slice(-6)}`,
          metadata: { total: orderRecord.total },
        });

        await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });

        return orderRecord;
      });

      Promise.all(pusherEventsToTrigger.map((fn) => fn())).catch((e) =>
        console.error("Pusher events failed", e),
      );

      return {
        success: true,
        orderIds: [order.id],
        paymentMethod,
      };
    }),

  initiatePayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        provider: z.enum(["PHONEPE", "MANUAL_UPI"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId, userId: ctx.user.id },
        include: { user: true, vendor: true },
      });

      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      const paymentRes = await initiatePayment(input.provider, {
        orderId: order.id,
        amount: order.total,
        customerName: order.user.name,
        customerEmail: order.user.email,
        customerPhone: order.user.phone || "",
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
        notes: {
          vendorUpiId: order.vendor?.upiId || "",
          vendorShopName: order.vendor?.shopName || "",
        },
      });

      if (paymentRes.success && paymentRes.paymentId) {
        // Record the PhonePe transaction reference / mapping to the database order
        await ctx.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId: paymentRes.paymentId,
            paymentMethod: input.provider,
          },
        });
      }

      return paymentRes;
    }),

  submitUtr: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        utrNumber: z
          .string()
          .regex(/^\d{12}$/, "UTR must be exactly 12 digits (numeric)"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId, userId: ctx.user.id },
      });

      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      // Enforce strict UTR uniqueness protection (double-spend / replay protection)
      const existingUtr = await ctx.prisma.order.findFirst({
        where: {
          utrNumber: input.utrNumber,
          id: { not: input.orderId },
        },
      });

      if (existingUtr) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This UTR number has already been submitted for another order. Please verify or contact support.",
        });
      }

      const updated = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          utrNumber: input.utrNumber,
          paymentMethod: "MANUAL_UPI",
          paymentStatus: "PENDING",
          timeline: {
            create: {
              status: order.status,
              message: `UTR ${input.utrNumber} submitted for verification.`,
            },
          },
        },
      });

      try {
        await pusherServer.trigger(
          CHANNELS.ADMIN,
          EVENTS.NEW_PAYMENT_VERIFICATION,
          {
            orderId: order.id,
            utrNumber: input.utrNumber,
            customerName: ctx.user.name,
          },
        );
      } catch (err) {
        console.error("[Order] Pusher admin notify failed for UTR:", err);
      }

      return updated;
    }),

  myOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { userId: ctx.user.id },
        include: {
          items: { take: 1, select: { image: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
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
          address: true,
          user: { select: { name: true, phone: true } },
          items: { include: { product: { select: { slug: true } } } },
          timeline: { orderBy: { createdAt: "desc" } },
          deliveryPartner: {
            select: { name: true, phone: true, avatar: true },
          },
        },
      });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }
      return order;
    }),

  invoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.user.id },
            { user: { role: "ADMIN" } }, // Admins can view invoices
          ],
        },
        include: {
          address: true,
          user: { select: { name: true, phone: true, email: true } },
          items: true,
          timeline: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      return order;
    }),

  // Admin Order Management Endpoints
  adminOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).nullish(),
        cursor: z.string().nullish(),
        status: z.nativeEnum(OrderStatus).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor, status } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { status: status },
        include: {
          user: { select: { name: true, phone: true } },
          address: true,
          items: true,
          deliveryPartner: { select: { name: true, phone: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem!.id;
      }
      return { orders, nextCursor };
    }),

  vendorStats: vendorProcedure.query(async ({ ctx }) => {
    const vendor = await ctx.prisma.vendor.findUnique({
      where: { userId: ctx.user.id },
    });
    if (!vendor) throw new TRPCError({ code: "NOT_FOUND" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingOrders, todayOrders, totalRevenue] = await Promise.all([
      ctx.prisma.order.count({
        where: { vendorId: vendor.id, status: "PENDING" },
      }),
      ctx.prisma.order.count({
        where: { vendorId: vendor.id, createdAt: { gte: today } },
      }),
      ctx.prisma.order.aggregate({
        where: { vendorId: vendor.id, status: "DELIVERED" },
        _sum: { total: true },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      pendingPayout: vendor.pendingPayout,
      pendingOrders,
      todayOrders,
      avgFulfillmentMinutes: 45, // Mock
      retentionRate: 85, // Mock
      growthRate: 12, // Mock
      seoScore: 75, // Mock
      dailySeries: [], // Mock or aggregate
      topProducts: [], // Mock or aggregate
    };
  }),

  vendorOrders: vendorProcedure
    .input(
      z.object({
        status: z.nativeEnum(OrderStatus).optional(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!vendor && ctx.user.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a vendor" });

      const { status, limit = 10 } = input;
      const orders = await ctx.prisma.order.findMany({
        where: {
          vendorId: vendor?.id,
          status: status,
        },
        include: {
          user: { select: { name: true, phone: true } },
          address: true,
          items: true,
          deliveryPartner: { select: { name: true, phone: true } },
          vendor: { select: { shopName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return { orders };
    }),

  vendorOrderById: vendorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!vendor && ctx.user.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a vendor" });

      const order = await ctx.prisma.order.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { name: true, phone: true } },
          address: true,
          items: true,
          vendor: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (ctx.user.role !== "ADMIN" && order.vendorId !== vendor?.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your order" });
      }

      return order;
    }),

  updateStatus: vendorProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.nativeEnum(OrderStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, status } = input;

      const order = await ctx.prisma.order.findFirst({
        where: { id: orderId },
        include: { user: { select: { phone: true } } },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      // If vendor, check ownership
      if (ctx.user.role === "VENDOR") {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { userId: ctx.user.id },
        });
        if (!vendor || order.vendorId !== vendor.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your order" });
        }
      }

      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["PREPARING"],
        PREPARING: ["READY"],
        READY: ["OUT_FOR_DELIVERY"],
        OUT_FOR_DELIVERY: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
        REFUNDED: [],
      };

      if (!validTransitions[order.status].includes(status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid status transition from ${order.status} to ${status}.`,
        });
      }

      const messages: Record<OrderStatus, string> = {
        CONFIRMED: "Order has been confirmed.",
        PREPARING: "Your order is being prepared.",
        READY: "Your order is ready for pickup.",
        OUT_FOR_DELIVERY: "Your order is out for delivery.",
        DELIVERED: "Your order has been delivered.",
        CANCELLED: "Your order has been cancelled.",
        PENDING: "",
        REFUNDED: "",
      };

      const updatedOrder = await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: orderId },
          data: {
            status,
            deliveredAt: status === "DELIVERED" ? new Date() : undefined,
            paymentStatus:
              status === "DELIVERED" && order.paymentMethod === "COD"
                ? "PAID"
                : order.paymentStatus,
            timeline: {
              create: {
                status,
                message: messages[status],
              },
            },
          },
        });

        // Daily 1Mart 1% Cashback Scheme
        if (status === "DELIVERED" && order.status !== "DELIVERED") {
          const cashbackAmount = Math.round(order.total * 0.01 * 100) / 100;
          if (cashbackAmount > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: { walletBalance: { increment: cashbackAmount } },
            });
            await tx.walletTransaction.create({
              data: {
                userId: order.userId,
                amount: cashbackAmount,
                type: "BONUS",
                status: "COMPLETED",
                description: `Daily 1Mart 1% Cashback for Order #${order.id.slice(-6)}`,
                reference: order.id,
              },
            });
            await tx.notification.create({
              data: {
                userId: order.userId,
                title: "Daily 1Mart Cashback! 💰",
                message: `Congratulations! You've received 1% cashback of ₹${cashbackAmount.toFixed(2)} in your wallet for Order #${order.id.slice(-6)}.`,
                type: "SYSTEM",
                link: "/wallet",
              },
            });
          }
        }

        // Referral logic
        if (status === "DELIVERED" && order.status !== "DELIVERED") {
          const userWithReferrer = await tx.user.findUnique({
            where: { id: order.userId },
            select: {
              referredById: true,
              _count: {
                select: { orders: { where: { status: "DELIVERED" } } },
              },
            },
          });

          if (
            userWithReferrer?.referredById &&
            userWithReferrer._count.orders === 0
          ) {
            const referrerId = userWithReferrer.referredById;
            const couponCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            await tx.coupon.create({
              data: {
                code: couponCode,
                type: "FIXED",
                value: 50,
                minOrder: 200,
                maxUses: 1,
              },
            });

            await tx.notification.create({
              data: {
                userId: referrerId,
                title: "Referral Reward! 🎁",
                message: `Your friend's first order was delivered! You've earned a ₹50 coupon: ${couponCode}`,
                type: "SYSTEM",
                link: "/profile",
              },
            });
          }
        }

        await logActivity({
          type: "ORDER",
          action: "STATUS_UPDATE",
          entityId: orderId,
          entityType: "Order",
          actorId: ctx.user.id,
          actorName: ctx.user.name,
          message: `Order #${orderId.slice(-6)} status updated to ${status}`,
          metadata: { status },
        });

        return updated;
      });

      try {
        await pusherServer.trigger(
          CHANNELS.ORDER(orderId),
          EVENTS.ORDER_STATUS_UPDATED,
          { status, message: messages[status] },
        );
      } catch (pusherErr) {
        console.error(
          "[Order] Pusher status update failed:",
          orderId,
          pusherErr,
        );
      }

      return {
        ...updatedOrder,
        userPhone: order.user.phone,
        shopName: "Deeshora",
      };
    }),

  verifyPayment: vendorProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["PAID", "FAILED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: { id: input.orderId },
      });
      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      // Ownership check for vendors
      if (ctx.user.role === "VENDOR") {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { userId: ctx.user.id },
        });
        if (!vendor || order.vendorId !== vendor.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your order" });
        }
      }

      const isPaid = input.status === "PAID";
      const updated = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          paymentStatus: input.status,
          status: isPaid ? "CONFIRMED" : order.status,
          timeline: {
            create: {
              status: isPaid ? "CONFIRMED" : order.status,
              message: isPaid 
                ? "Payment verified and order confirmed successfully!" 
                : `Payment marked as ${input.status}.`,
            },
          },
        },
      });

      await logActivity({
        type: "ORDER",
        action: "UPDATE",
        entityId: order.id,
        entityType: "Order",
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Payment verified as ${input.status} for order #${order.id.slice(-6)}`,
        metadata: { paymentStatus: input.status },
      });

      try {
        await pusherServer.trigger(
          CHANNELS.ORDER(input.orderId),
          EVENTS.PAYMENT_VERIFIED,
          {
            status: input.status,
            message: `Payment verified as ${input.status}.`,
          },
        );

        if (isPaid) {
          // Trigger real-time status update broadcast too
          await pusherServer.trigger(
            CHANNELS.ORDER(input.orderId),
            EVENTS.ORDER_STATUS_UPDATED,
            { status: "CONFIRMED", message: "Order has been confirmed." },
          );
        }
      } catch (err) {
        console.error("Pusher verify failed", err);
      }

      return updated;
    }),

  reorder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId, userId: ctx.user.id },
        include: { items: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      await ctx.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
          where: { userId: ctx.user.id },
          update: {},
          create: { userId: ctx.user.id },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        for (const item of order.items) {
          // Verify product exists and is active
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (product && product.isActive) {
            await tx.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                quantity: item.quantity,
              },
            });
          }
        }
      });

      return { success: true };
    }),
});
