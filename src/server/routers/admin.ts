import { z } from 'zod';
import { createTRPCRouter, adminProcedure, publicProcedure, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { VendorStatus, UserRole, OrderStatus } from '@prisma/client';
import { uploadImage } from '@/lib/cloudinary';
import slugify from 'slugify';


export const adminRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    const totalUsers = await ctx.prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalVendors = await ctx.prisma.vendor.count({ where: { status: 'APPROVED' } });
    const pendingVendors = await ctx.prisma.vendor.count({ where: { status: 'PENDING' } });
    const totalOrders = await ctx.prisma.order.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await ctx.prisma.order.count({ where: { createdAt: { gte: today } } });


    const platformRevenue = await ctx.prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { commission: true },
    });


    const pendingPayouts = await ctx.prisma.vendor.aggregate({
      _sum: { pendingPayout: true },
    });


    // Monthly revenue for the last 6 months
    const monthlyRevenueData = await ctx.prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT
        to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
        SUM(commission) as revenue
      FROM "Order"
      WHERE "paymentStatus" = 'PAID' AND "createdAt" >= date_trunc('month', current_date - interval '5 months')
      GROUP BY 1
      ORDER BY 1;
    `;


    return {
      totalUsers,
      totalVendors,
      pendingVendors,
      totalOrders,
      todayOrders,
      platformRevenue: platformRevenue._sum.commission ?? 0,
      pendingPayouts: pendingPayouts._sum.pendingPayout ?? 0,
      monthlyRevenue: monthlyRevenueData,
    };
  }),


  /**
   * Per-vendor analytics broken down by period
   * period: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL'
   */
  vendorAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']).default('MONTHLY'),
        vendorId: z.string().optional(), // if omitted, return all vendors
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;
      let intervals: number;
      let intervalLabel: string;

      switch (input.period) {
        case 'QUARTERLY':   since = new Date(now.getFullYear(), now.getMonth() - 2, 1); intervals = 3;  intervalLabel = 'month'; break;
        case 'HALF_YEARLY': since = new Date(now.getFullYear(), now.getMonth() - 5, 1); intervals = 6;  intervalLabel = 'month'; break;
        case 'ANNUAL':      since = new Date(now.getFullYear() - 1, now.getMonth(), 1); intervals = 12; intervalLabel = 'month'; break;
        default:            since = new Date(now.getFullYear(), now.getMonth(), 1);      intervals = 1;  intervalLabel = 'month';
      }

      const where: any = {
        paymentStatus: 'PAID',
        createdAt: { gte: since },
        ...(input.vendorId ? { vendorId: input.vendorId } : {}),
      };

      // Get all approved vendors
      const vendors = await ctx.prisma.vendor.findMany({
        where: input.vendorId ? { id: input.vendorId } : { status: 'APPROVED' },
        select: { id: true, shopName: true, logo: true, commissionRate: true },
      });

      // Per-vendor aggregated stats in period
      const vendorStats = await Promise.all(vendors.map(async (vendor) => {
        const agg = await ctx.prisma.order.aggregate({
          where: { ...where, vendorId: vendor.id },
          _sum: { vendorAmount: true, total: true, commission: true },
          _count: { id: true },
        });

        // Top 3 products by revenue in period
        const topItems = await ctx.prisma.orderItem.groupBy({
          by: ['name'],
          where: {
            order: {
              vendorId: vendor.id,
              paymentStatus: 'PAID',
              createdAt: { gte: since },
            },
          },
          _sum: { total: true, quantity: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 3,
        });

        return {
          vendorId: vendor.id,
          shopName: vendor.shopName,
          logo: vendor.logo,
          orders: agg._count.id,
          revenue: agg._sum.total ?? 0,
          vendorEarnings: agg._sum.vendorAmount ?? 0,
          commission: agg._sum.commission ?? 0,
          topProducts: topItems.map(i => ({ name: i.name, revenue: i._sum.total ?? 0, qty: i._sum.quantity ?? 0 })),
        };
      }));

      // Monthly breakdown for chart (all vendors or single vendor)
      const monthlyBreakdown = await ctx.prisma.$queryRaw<Array<{ month: string; revenue: number; orders: number }>>`
        SELECT
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
          SUM("total") as revenue,
          COUNT(*) as orders
        FROM "Order"
        WHERE "paymentStatus" = 'PAID'
          AND "createdAt" >= ${since}
          ${input.vendorId ? ctx.prisma.$queryRaw`AND "vendorId" = ${input.vendorId}` : ctx.prisma.$queryRaw``}
        GROUP BY 1
        ORDER BY 1;
      `;

      return {
        period: input.period,
        since: since.toISOString(),
        vendorStats: vendorStats.sort((a, b) => b.revenue - a.revenue),
        monthlyBreakdown,
      };
    }),

  /** Platform-wide analytics summary */
  platformAnalytics: adminProcedure
    .input(z.object({ period: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']).default('ANNUAL') }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;
      switch (input.period) {
        case 'QUARTERLY':   since = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
        case 'HALF_YEARLY': since = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
        case 'ANNUAL':      since = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
        default:            since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [orderAgg, newUsers, newVendors, topVendors] = await Promise.all([
        ctx.prisma.order.aggregate({
          where: { paymentStatus: 'PAID', createdAt: { gte: since } },
          _sum: { total: true, commission: true },
          _count: { id: true },
        }),
        ctx.prisma.user.count({ where: { createdAt: { gte: since }, role: 'CUSTOMER' } }),
        ctx.prisma.vendor.count({ where: { createdAt: { gte: since } } }),
        ctx.prisma.order.groupBy({
          by: ['vendorId'],
          where: { paymentStatus: 'PAID', createdAt: { gte: since } },
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 5,
        }),
      ]);

      const topVendorDetails = await ctx.prisma.vendor.findMany({
        where: { id: { in: topVendors.map(v => v.vendorId) } },
        select: { id: true, shopName: true, logo: true },
      });

      return {
        period: input.period,
        totalRevenue: orderAgg._sum.total ?? 0,
        platformCommission: orderAgg._sum.commission ?? 0,
        totalOrders: orderAgg._count.id,
        newUsers,
        newVendors,
        topVendors: topVendors.map(v => ({
          ...v,
          shopName: topVendorDetails.find(d => d.id === v.vendorId)?.shopName ?? '',
          logo: topVendorDetails.find(d => d.id === v.vendorId)?.logo ?? null,
        })),
      };
    }),


  vendors: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        status: z.nativeEnum(VendorStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor, status } = input;
      const vendors = await ctx.prisma.vendor.findMany({
        take: limit + 1,
        where: { status },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { products: true, orders: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });


      let nextCursor: typeof cursor | undefined = undefined;
      if (vendors.length > limit) {
        const nextItem = vendors.pop();
        nextCursor = nextItem!.id;
      }
      return { vendors, nextCursor };
    }),


  updateVendorStatus: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        status: z.nativeEnum(VendorStatus),
        commissionRate: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: {
          status: input.status,
          commissionRate: input.commissionRate,
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
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const { cursor, role, search } = input;
      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        where: {
          role,
          OR: search
            ? [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]
            : undefined,
        },
        include: { _count: { select: { orders: true } } },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;
      
      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      // Sync with Clerk metadata
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.clerkId, {
          publicMetadata: { role }
        });
      } catch (err) {
        console.error('[Admin] Failed to sync Clerk metadata:', err);
      }

      return user;
    }),


  orders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        status: z.nativeEnum(OrderStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 15;
      const { cursor, status } = input;
      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        where: { status: status as any },
        include: {
          user: { select: { name: true, email: true } },
          vendor: { select: { shopName: true } },
          items: { take: 3, select: { name: true } },
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


  processPayout: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        amount: z.number().positive(),
        utrNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found.' });
      }
      if (input.amount > vendor.pendingPayout) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payout amount exceeds pending payout.' });
      }


      return ctx.prisma.$transaction(async (tx) => {
        await tx.vendor.update({
          where: { id: input.vendorId },
          data: {
            pendingPayout: { decrement: input.amount },
            totalEarnings: { increment: input.amount },
          },
        });
        return tx.payout.create({
          data: {
            vendorId: input.vendorId,
            amount: input.amount,
            utrNumber: input.utrNumber,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });
      });
    }),


  payouts: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const { cursor } = input;
      const payouts = await ctx.prisma.payout.findMany({
        take: limit + 1,
        include: { vendor: { select: { shopName: true } } },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });


      let nextCursor: typeof cursor | undefined = undefined;
      if (payouts.length > limit) {
        const nextItem = payouts.pop();
        nextCursor = nextItem!.id;
      }
      return { payouts, nextCursor };
    }),


  getConfig: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.siteConfig.findMany();
  }),


  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const keys = ['business_whatsapp', 'delivery_partners', 'delivery_fee', 'free_delivery_above'];
    return ctx.prisma.siteConfig.findMany({
      where: { key: { in: keys } },
    });
  }),


  updateConfig: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      })
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
        vendorId: z.string().optional(),
        categoryId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const { cursor, search, vendorId, categoryId } = input;
      const products = await ctx.prisma.product.findMany({
        take: limit + 1,
        where: {
          vendorId,
          categoryId,
          OR: search
            ? [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        include: {
          vendor: { select: { shopName: true, city: true } },
          category: { select: { name: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem!.id;
      }

      const total = await ctx.prisma.product.count({
        where: {
          vendorId,
          categoryId,
          OR: search
            ? [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            : undefined,
        },
      });

      return { products, nextCursor, total };
    }),

  createProduct: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        name: z.string().min(3),
        description: z.string().min(10),
        price: z.number().positive(),
        mrp: z.number().positive(),
        stock: z.number().int().min(0),
        unit: z.string(),
        categoryId: z.string(),
        images: z.array(z.string().startsWith('data:image/')).min(1),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found.' });
      }

      const imageUrls = await Promise.all(
        input.images.map((base64) => uploadImage(base64, 'products'))
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
          vendorId: input.vendorId,
        },
      });
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.delete({ where: { id: input.id } });
    }),


  // ─── SERVICE AREA MANAGEMENT ───────────────────────────────────────────

  /** Public: get all active areas (used by OnboardingModal & profile page) */
  getServiceAreas: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: [{ isServiceable: 'desc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
  }),


  /** Admin: get ALL areas including inactive */
  getAllServiceAreas: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.serviceArea.findMany({
      orderBy: [{ isServiceable: 'desc' }, { sortOrder: 'asc' }],
    });
  }),


  /** Admin: create a new service area */
  createServiceArea: adminProcedure
    .input(
      z.object({
        label: z.string().min(2, 'Label required'),
        value: z.string().min(2, 'Value required'),
        zone: z.string().min(2, 'Zone required'),
        pincode: z.string().optional(),
        isServiceable: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.serviceArea.create({
        data: { ...input, isActive: true },
      });
    }),


  /** Admin: update an existing service area */
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.serviceArea.update({
        where: { id },
        data,
      });
    }),


  /** Admin: delete an area */
  deleteServiceArea: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.serviceArea.delete({ where: { id: input.id } });
    }),

  /** Admin: manually override any order's status */
  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.nativeEnum(OrderStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { pusherServer, CHANNELS, EVENTS } = await import('@/lib/pusher');
      const { orderId, status } = input;

      const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });

      const messages: Record<OrderStatus, string> = {
        CONFIRMED:        'Order confirmed by admin.',
        PREPARING:        'Your order is being prepared.',
        READY:            'Your order is ready for pickup.',
        OUT_FOR_DELIVERY: 'Your order is out for delivery.',
        DELIVERED:        'Your order has been delivered.',
        CANCELLED:        'Your order has been cancelled.',
        REFUNDED:         'Your order has been refunded.',
        PENDING:          '',
      };

      const updated = await ctx.prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          timeline: {
            create: { status, message: messages[status] },
          },
        },
      });

      await pusherServer.trigger(
        CHANNELS.ORDER(orderId),
        EVENTS.ORDER_STATUS_UPDATED,
        { status, message: messages[status] }
      );

      return updated;
    }),

  /** GST and Tax Reporting */
  gstReport: adminProcedure
    .input(z.object({ period: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']).default('MONTHLY') }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;
      switch (input.period) {
        case 'QUARTERLY':   since = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
        case 'HALF_YEARLY': since = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
        case 'ANNUAL':      since = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
        default:            since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const items = await ctx.prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'PAID', createdAt: { gte: since } } },
        include: { order: { select: { id: true, total: true, vendor: { select: { id: true, shopName: true, gstNumber: true } } } } }
      });

      const vendorMap: Record<string, { shopName: string; gstNumber: string; taxableAmount: number; gstAmount: number; total: number }> = {};
      let totalGst = 0;
      let totalTaxable = 0;

      items.forEach(item => {
        const v = item.order.vendor;
        if (!vendorMap[v.id]) {
          vendorMap[v.id] = { shopName: v.shopName, gstNumber: v.gstNumber || 'No GSTIN', taxableAmount: 0, gstAmount: 0, total: 0 };
        }
        const taxable = item.price * item.quantity;
        vendorMap[v.id].taxableAmount += taxable;
        vendorMap[v.id].gstAmount += item.gstAmount;
        vendorMap[v.id].total += (taxable + item.gstAmount);
        totalGst += item.gstAmount;
        totalTaxable += taxable;
      });

      return {
        summary: { totalGst, totalTaxable, period: input.period, vendorsCount: Object.keys(vendorMap).length },
        vendors: Object.values(vendorMap).sort((a, b) => b.gstAmount - a.gstAmount)
      };
    }),
});