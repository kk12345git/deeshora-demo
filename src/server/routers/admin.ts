import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  publicProcedure,
  protectedProcedure,
} from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import {
  UserRole,
  OrderStatus,
  Prisma,
  VendorStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";
import slugify from "slugify";
import { logActivity } from "@/lib/activity";

export const adminRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    let totalUsers = 0;
    let totalDeliveryPartners = 0;
    let onlinePartners = 0;

    try {
      totalUsers = await ctx.prisma.user.count();
      totalDeliveryPartners = await ctx.prisma.user.count({
        where: { role: "DELIVERY_PARTNER" },
      });
      onlinePartners = await ctx.prisma.user.count({
        where: { role: "DELIVERY_PARTNER", isDeliveryOnline: true },
      });
    } catch (e) {
      console.error("[AdminStats] Counts failed:", e);
    }

    const totalOrders = await ctx.prisma.order.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await ctx.prisma.order.count({
      where: { createdAt: { gte: today } },
    });

    const platformRevenue = await ctx.prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    });

    let monthlyRevenueData: Array<{ month: string; revenue: number }> = [];
    try {
      monthlyRevenueData = await ctx.prisma.$queryRaw<
        Array<{ month: string; revenue: number }>
      >`
        SELECT
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
          CAST(SUM(total) AS FLOAT8) as revenue
        FROM "Order"
        WHERE "paymentStatus" = 'PAID' AND "createdAt" >= date_trunc('month', current_date - interval '5 months')
        GROUP BY 1
        ORDER BY 1;
      `;
    } catch (e) {
      console.error("[AdminStats] Raw query failed:", e);
    }

    return {
      totalUsers,
      totalOrders,
      todayOrders,
      totalDeliveryPartners,
      onlinePartners,
      platformRevenue: platformRevenue._sum.total ?? 0,
      monthlyRevenue: monthlyRevenueData,
    };
  }),

  activities: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.activityLog.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });
    }),

  platformAnalytics: adminProcedure
    .input(
      z.object({
        period: z
          .enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"])
          .default("ANNUAL"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;
      switch (input.period) {
        case "QUARTERLY":
          since = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case "HALF_YEARLY":
          since = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case "ANNUAL":
          since = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          break;
        default:
          since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const orderAgg = await ctx.prisma.order.aggregate({
        where: { paymentStatus: "PAID", createdAt: { gte: since } },
        _sum: { total: true, platformFee: true },
        _count: { _all: true },
      });

      const [newUsers, newVendors] = await Promise.all([
        ctx.prisma.user.count({
          where: { createdAt: { gte: since }, role: "CUSTOMER" },
        }),
        ctx.prisma.user.count({
          where: { createdAt: { gte: since }, role: "VENDOR" },
        }),
      ]);

      const topVendors = await ctx.prisma.vendor.findMany({
        take: 5,
        include: {
          _count: {
            select: {
              orders: {
                where: { paymentStatus: "PAID", createdAt: { gte: since } },
              },
            },
          },
          orders: {
            where: { paymentStatus: "PAID", createdAt: { gte: since } },
            select: { total: true },
          },
        },
      });

      const formattedTopVendors = topVendors
        .map((v) => ({
          vendorId: v.id,
          shopName: v.shopName,
          _sum: { total: v.orders.reduce((acc, o) => acc + o.total, 0) },
          _count: { orders: v._count.orders },
        }))
        .sort((a, b) => b._sum.total - a._sum.total);

      return {
        period: input.period,
        totalRevenue: orderAgg._sum.total ?? 0,
        platformCommission: orderAgg._sum.platformFee ?? 0,
        totalOrders: orderAgg._count._all,
        newUsers,
        newVendors,
        topVendors: formattedTopVendors,
      };
    }),

  vendorAnalytics: adminProcedure
    .input(
      z.object({
        period: z
          .enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"])
          .default("ANNUAL"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;
      switch (input.period) {
        case "QUARTERLY":
          since = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case "HALF_YEARLY":
          since = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case "ANNUAL":
          since = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          break;
        default:
          since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // 1. Monthly Breakdown
      const monthlyData = await ctx.prisma.$queryRaw<
        Array<{ month: string; revenue: number; orders: number }>
      >`
        SELECT 
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
          CAST(SUM(total) AS FLOAT8) as revenue,
          CAST(COUNT(id) AS INTEGER) as orders
        FROM "Order"
        WHERE "paymentStatus" = 'PAID' AND "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC;
      `;

      // 2. Vendor Stats
      const vendors = await ctx.prisma.vendor.findMany({
        include: {
          orders: {
            where: { paymentStatus: "PAID", createdAt: { gte: since } },
            include: { items: true },
          },
        },
      });

      const vendorStats = vendors.map((v) => {
        const revenue = v.orders.reduce((acc, o) => acc + o.total, 0);
        const commission = v.orders.reduce((acc, o) => acc + o.platformFee, 0);
        
        // Group by product
        const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
        v.orders.forEach(o => {
          o.items.forEach(item => {
            if (!productMap[item.productId]) {
              productMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
            }
            productMap[item.productId].qty += item.quantity;
            productMap[item.productId].revenue += item.price * item.quantity;
          });
        });

        const topProducts = Object.values(productMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 4);

        return {
          vendorId: v.id,
          shopName: v.shopName,
          revenue,
          orders: v.orders.length,
          vendorEarnings: revenue - commission,
          commission,
          topProducts,
        };
      }).sort((a, b) => b.revenue - a.revenue);

      return {
        monthlyBreakdown: monthlyData,
        vendorStats,
      };
    }),

  getConfig: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.siteConfig.findMany();
  }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const keys = [
      "business_whatsapp",
      "delivery_partners",
      "delivery_fee",
      "free_delivery_above",
      "platform_fixed_fee",
    ];
    return ctx.prisma.siteConfig.findMany({
      where: { key: { in: keys } },
    });
  }),

  updateConfig: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.siteConfig.upsert({
        where: { key: input.key },
        create: { key: input.key, value: input.value },
        update: { value: input.value },
      });
    }),

  products: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        search: z.string().optional(),
        categoryId: z.string().optional(),
        vendorId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const { cursor, search, categoryId, vendorId } = input;
      const products = await ctx.prisma.product.findMany({
        take: limit + 1,
        where: {
          categoryId,
          vendorId,
          OR: search
            ? [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        include: {
          category: { select: { name: true, commissionRate: true } },
          vendor: { select: { shopName: true, commissionRate: true, city: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem!.id;
      }

      const total = await ctx.prisma.product.count({
        where: {
          categoryId,
          vendorId,
          OR: search
            ? [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
      });

      return { products, nextCursor, total };
    }),

  createProduct: adminProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().min(10),
        price: z.number().positive(),
        mrp: z.number().positive(),
        stock: z.number().int().min(0),
        unit: z.string(),
        categoryId: z.string(),
        images: z.array(z.string().startsWith("data:image/")).min(1),
        isFeatured: z.boolean().optional(),
        commissionRate: z.number().min(0).max(1).optional(),
        vendorId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const imageUrls = await Promise.all(
        input.images.map((base64) => uploadImage(base64, "products")),
      );

      const slug = `${slugify(input.name, { lower: true, strict: true })}-${Date.now()}`;

      return ctx.prisma.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          price: input.price,
          mrp: input.mrp,
          stock: input.stock,
          unit: input.unit,
          categoryId: input.categoryId,
          images: imageUrls,
          isFeatured: input.isFeatured ?? false,
          commissionRate: input.commissionRate,
          vendorId: input.vendorId,
        },
      });
    }),

  updateProduct: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        mrp: z.number().optional(),
        stock: z.number().optional(),
        unit: z.string().optional(),
        categoryId: z.string().optional(),
        isFeatured: z.boolean().optional(),
        isActive: z.boolean().optional(),
        commissionRate: z.number().min(0).max(1).optional(),
        vendorId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.product.update({
        where: { id },
        data,
      });

      await logActivity({
        type: "PRODUCT",
        action: "UPDATE",
        entityId: id,
        entityType: "Product",
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin updated product: ${updated.name}`,
        metadata: data,
      });

      return updated;
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: { _count: { select: { orderItems: true } } },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product._count.orderItems > 0) {
        const deactivated = await ctx.prisma.product.update({
          where: { id: input.id },
          data: { isActive: false, isFeatured: false },
        });

        await logActivity({
          type: "PRODUCT",
          action: "UPDATE",
          entityId: input.id,
          entityType: "Product",
          actorId: ctx.user.id,
          actorName: ctx.user.name,
          message: `Admin deactivated product (has order history): ${product.name}`,
        });

        return deactivated;
      }

      const deleted = await ctx.prisma.product.delete({
        where: { id: input.id },
      });

      await logActivity({
        type: "PRODUCT",
        action: "DELETE",
        entityId: input.id,
        entityType: "Product",
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin deleted product: ${product.name}`,
      });

      return deleted;
    }),

  // ─── SERVICE AREA MANAGEMENT ───────────────────────────────────────────

  getServiceAreas: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: [
        { isServiceable: "desc" },
        { sortOrder: "asc" },
        { label: "asc" },
      ],
    });
  }),

  getAllServiceAreas: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.serviceArea.findMany({
      orderBy: [{ isServiceable: "desc" }, { sortOrder: "asc" }],
    });
  }),

  createServiceArea: adminProcedure
    .input(
      z.object({
        label: z.string().min(2, "Label required"),
        value: z.string().min(2, "Value required"),
        zone: z.string().min(2, "Zone required"),
        pincode: z.string().optional(),
        isServiceable: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        coordinates: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.serviceArea.create({
        data: { ...input, isActive: true },
      });
    }),

  updateServiceArea: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(2).optional(),
        zone: z.string().min(2).optional(),
        pincode: z.string().optional(),
        isServiceable: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        coordinates: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.serviceArea.update({
        where: { id },
        data,
      });
    }),

  deleteServiceArea: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.serviceArea.delete({ where: { id: input.id } });
    }),

  // ─── CATEGORY MANAGEMENT ───────────────────────────────────────────────

  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().min(2),
        image: z.string().url().optional(),
        description: z.string().optional(),
        sortOrder: z.number().int().default(0),
        isActive: z.boolean().optional(),
        commissionRate: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.category.findUnique({
        where: { slug: input.slug },
      });
      if (existing)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category slug already exists.",
        });
      return ctx.prisma.category.create({ data: input });
    }),

  updateCategory: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        slug: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
        commissionRate: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.category.update({ where: { id }, data });
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: { _count: { select: { products: true } } },
      });

      if (!category)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found.",
        });
      if (category._count.products > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete category with active products.",
        });
      }

      return ctx.prisma.category.delete({
        where: { id: input.id },
      });
    }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.nativeEnum(OrderStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { pusherServer, CHANNELS, EVENTS } = await import("@/lib/pusher");
      const { orderId, status } = input;

      const order = await ctx.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      const messages: Record<OrderStatus, string> = {
        CONFIRMED: "Order confirmed by admin.",
        PREPARING: "Your order is being prepared.",
        READY: "Your order is ready for pickup.",
        OUT_FOR_DELIVERY: "Your order is out for delivery.",
        DELIVERED: "Your order has been delivered.",
        CANCELLED: "Your order has been cancelled.",
        REFUNDED: "Your order has been refunded.",
        PENDING: "",
      };

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status,
            deliveredAt: status === "DELIVERED" ? new Date() : undefined,
            timeline: {
              create: { status, message: messages[status] },
            },
          },
        });

        return updatedOrder;
      });

      try {
        await pusherServer.trigger(
          CHANNELS.ORDER(orderId),
          EVENTS.ORDER_STATUS_UPDATED,
          { status, message: messages[status] },
        );
      } catch (pusherErr) {
        console.error(
          "[Admin] Pusher notify failed for order:",
          orderId,
          pusherErr,
        );
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
    }),

  verifyOrderPayment: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["PAID", "FAILED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      const updated = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          paymentStatus: input.status,
          timeline: {
            create: {
              status: order.status,
              message:
                input.status === "PAID"
                  ? "Payment verified by admin."
                  : "Payment verification failed.",
            },
          },
        },
      });

      try {
        const { pusherServer, CHANNELS, EVENTS } = await import("@/lib/pusher");
        await pusherServer.trigger(
          CHANNELS.ORDER(input.orderId),
          EVENTS.ORDER_STATUS_UPDATED,
          {
            status: order.status,
            message:
              input.status === "PAID"
                ? "Payment confirmed by platform!"
                : "Payment failed.",
          },
        );
      } catch (e) {}

      await logActivity({
        type: "ORDER",
        action: "PAYMENT_VERIFY",
        entityId: input.orderId,
        entityType: "Order",
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin verified payment for order #${input.orderId.slice(-6)} as ${input.status}`,
      });

      return updated;
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own admin account.",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });

      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        await clerk.users.deleteUser(user.clerkId);
      } catch (err) {
        console.error("[Admin] Failed to delete Clerk user:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to delete user from auth provider. Please try again.",
        });
      }

      await ctx.prisma.user.delete({ where: { id: input.userId } });

      await logActivity({
        type: "USER",
        action: "DELETE",
        entityId: input.userId,
        entityType: "User",
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin deleted user account for ${user.name} (${user.email})`,
      });

      return { success: true };
    }),

  gstReport: adminProcedure
    .input(
      z.object({
        period: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since = new Date();

      switch (input.period) {
        case "MONTHLY":
          since.setMonth(now.getMonth() - 1);
          break;
        case "QUARTERLY":
          since.setMonth(now.getMonth() - 3);
          break;
        case "HALF_YEARLY":
          since.setMonth(now.getMonth() - 6);
          break;
        case "ANNUAL":
          since.setFullYear(now.getFullYear() - 1);
          break;
      }

      const orders = await ctx.prisma.order.findMany({
        where: {
          createdAt: { gte: since },
          paymentStatus: "PAID",
        },
        include: {
          vendor: {
            select: {
              shopName: true,
              gstNumber: true,
            },
          },
        },
      });

      const vendorMap = new Map<
        string,
        {
          shopName: string;
          gstNumber: string;
          taxableAmount: number;
          gstAmount: number;
          total: number;
        }
      >();

      let totalTaxable = 0;
      let totalGst = 0;

      orders.forEach((order) => {
        const vendorKey = order.vendorId || "platform";
        const vendorData = order.vendor;
        const current = vendorMap.get(vendorKey) || {
          shopName: vendorData?.shopName || "Platform",
          gstNumber: vendorData?.gstNumber || "No GSTIN",
          taxableAmount: 0,
          gstAmount: 0,
          total: 0,
        };

        // Simplified calculation for demo: assuming price includes 18% GST
        const orderTaxable = order.total / 1.18;
        const orderGst = order.total - orderTaxable;

        current.taxableAmount += orderTaxable;
        current.gstAmount += orderGst;
        current.total += order.total;

        totalTaxable += orderTaxable;
        totalGst += orderGst;

        vendorMap.set(vendorKey, current);
      });

      return {
        summary: {
          totalGst,
          totalTaxable,
          vendorsCount: vendorMap.size,
        },
        vendors: Array.from(vendorMap.values()),
      };
    }),

  getPendingVerifications: adminProcedure.query(async ({ ctx }) => {
    const [pendingOrders, pendingSubscriptions] = await Promise.all([
      ctx.prisma.order.findMany({
        where: { paymentStatus: "PENDING", utrNumber: { not: null } },
        include: {
          user: { select: { name: true } },
          vendor: { select: { shopName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      ctx.prisma.vendor.findMany({
        where: {
          subscriptionStatus: "PENDING",
          subscriptionUtr: { not: null },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return { pendingOrders, pendingSubscriptions };
  }),

  approvePayment: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingOrder = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        select: { paymentStatus: true },
      });
      if (!existingOrder)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      return ctx.prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: input.orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            timeline: {
              create: {
                status: "CONFIRMED",
                message: "Payment verified manually by admin. Order confirmed.",
              },
            },
          },
        });
        return order;
      });
    }),

  approveSubscription: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.vendorId },
      });
      if (!vendor)
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found." });

      return ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: {
          subscriptionStatus: "ACTIVE",
          status: "APPROVED",
        },
      });
    }),

  users: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        role: z.nativeEnum(UserRole).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const { cursor, role, search } = input;
      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        where: {
          role,
          OR: search
            ? [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        include: { _count: { select: { orders: true } } },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }
      return { users, nextCursor };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;

      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.clerkId, {
          publicMetadata: { role },
        });
      } catch (err) {
        console.error("[Admin] Failed to sync Clerk metadata:", err);
      }

      return user;
    }),

  vendors: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(VendorStatus).optional(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status } = input;
      const vendors = await ctx.prisma.vendor.findMany({
        where: status ? { status } : undefined,
        include: {
          user: { select: { name: true, email: true, avatar: true } },
          _count: { select: { products: true, orders: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return { vendors };
    }),

  updateVendorStatus: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        status: z.enum(["PENDING", "APPROVED", "SUSPENDED"]),
        commissionRate: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: {
          status: input.status,
          commissionRate: input.commissionRate,
        },
        include: { user: true },
      });

      // If approved, ensure user role is VENDOR
      if (input.status === "APPROVED") {
        await ctx.prisma.user.update({
          where: { id: vendor.userId },
          data: { role: "VENDOR" },
        });

        try {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const clerk = await clerkClient();
          await clerk.users.updateUserMetadata(vendor.user.clerkId, {
            publicMetadata: { role: "VENDOR" },
          });
        } catch (err) {
          console.error(
            "[Admin] Failed to sync Clerk metadata for vendor:",
            err,
          );
        }
      }

      return vendor;
    }),

  confirmVendorPayment: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: {
          subscriptionStatus: "ACTIVE",
          status: "APPROVED",
        },
      });
    }),

  updateVendorCommission: adminProcedure
    .input(z.object({ vendorId: z.string(), rate: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: { commissionRate: input.rate / 100 },
      });
    }),

  createVendor: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        shopName: z.string().min(3),
        phone: z.string(),
        email: z.string().email(),
        city: z.string(),
        categories: z.array(z.string()),
        commissionRate: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, ...vendorData } = input;

      // 1. Create the vendor record
      const vendor = await ctx.prisma.vendor.create({
        data: {
          userId,
          ...vendorData,
          status: "APPROVED",
          subscriptionStatus: "ACTIVE",
        },
      });

      // 2. Update user role
      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data: { role: "VENDOR" },
      });

      // 3. Sync Clerk
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.clerkId, {
          publicMetadata: { role: "VENDOR" },
        });
      } catch (err) {
        console.error(
          "[Admin] Failed to sync Clerk metadata for new vendor:",
          err,
        );
      }

      return vendor;
    }),

  orders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        status: z.nativeEnum(OrderStatus).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 15;
      const { cursor, status } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { status: status },
        include: {
          user: { select: { name: true, email: true } },
          items: { take: 3, select: { name: true, price: true } },
          vendor: { select: { shopName: true, city: true } },
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

  payouts: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const payouts = await ctx.prisma.payout.findMany({
        take: input.limit,
        include: { vendor: { select: { shopName: true } } },
        orderBy: { createdAt: "desc" },
      });
      return { payouts };
    }),

  processPayout: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        amount: z.number().positive(),
        utrNumber: z.string().min(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.vendorId },
      });
      if (!vendor)
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
      if (vendor.pendingPayout < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient pending balance",
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        const payout = await tx.payout.create({
          data: {
            vendorId: input.vendorId,
            amount: input.amount,
            utrNumber: input.utrNumber,
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });

        await tx.vendor.update({
          where: { id: input.vendorId },
          data: {
            pendingPayout: { decrement: input.amount },
            totalEarnings: { increment: input.amount },
          },
        });

        return payout;
      });
    }),
});
