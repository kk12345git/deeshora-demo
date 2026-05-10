import { z } from 'zod';
import { createTRPCRouter, adminProcedure, publicProcedure, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { VendorStatus, UserRole, OrderStatus, Prisma } from '@prisma/client';
import { uploadImage } from '@/lib/cloudinary';
import slugify from 'slugify';
import { logActivity } from '@/lib/activity';


export const adminRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    let totalUsers = 0;
    let totalDeliveryPartners = 0;
    let onlinePartners = 0;

    try {
      totalUsers = await ctx.prisma.user.count({ where: { role: 'CUSTOMER' } });
      totalDeliveryPartners = await ctx.prisma.user.count({ where: { role: 'DELIVERY_PARTNER' } });
      onlinePartners = await ctx.prisma.user.count({ where: { role: 'DELIVERY_PARTNER', isDeliveryOnline: true } });
    } catch (e) {
      console.error('[AdminStats] User/Partner counts failed (likely Enum mismatch):', e);
    }

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
    let monthlyRevenueData: Array<{ month: string; revenue: number }> = [];
    try {
      monthlyRevenueData = await ctx.prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
        SELECT
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
          CAST(SUM(commission) AS FLOAT8) as revenue
        FROM "Order"
        WHERE "paymentStatus" = 'PAID' AND "createdAt" >= date_trunc('month', current_date - interval '5 months')
        GROUP BY 1
        ORDER BY 1;
      `;
    } catch (e) {
      console.error('[AdminStats] Raw query failed:', e);
    }

    return {
      totalUsers,
      totalVendors,
      pendingVendors,
      totalOrders,
      todayOrders,
      totalDeliveryPartners,
      onlinePartners,
      platformRevenue: platformRevenue._sum.commission ?? 0,
      pendingPayouts: pendingPayouts._sum.pendingPayout ?? 0,
      monthlyRevenue: monthlyRevenueData,
    };
  }),


  activities: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.activityLog.findMany({
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      });
    }),


  /**
   * Per-vendor analytics broken down by period
   * period: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL'
   */
  vendorAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']).default('MONTHLY'),
        vendorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let since: Date;

      switch (input.period) {
        case 'QUARTERLY':   since = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
        case 'HALF_YEARLY': since = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
        case 'ANNUAL':      since = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
        default:            since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // L2: Properly typed where clause — no `any`
      const where: Prisma.OrderWhereInput = {
        paymentStatus: 'PAID',
        createdAt: { gte: since },
        ...(input.vendorId ? { vendorId: input.vendorId } : {}),
      };

      // Get aggregated stats for all relevant vendors in one query
      const stats = await ctx.prisma.order.groupBy({
        by: ['vendorId'],
        where,
        _sum: { vendorAmount: true, total: true, commission: true },
        _count: { id: true },
      });

      // Get vendor details for the stats we found
      const vendors = await ctx.prisma.vendor.findMany({
        where: { id: { in: stats.map((s) => s.vendorId) } },
        select: { id: true, shopName: true, logo: true },
      });

      const vendorStats = stats.map((s) => {
        const vendor = vendors.find((v) => v.id === s.vendorId);
        return {
          vendorId: s.vendorId,
          shopName: vendor?.shopName || 'Unknown',
          logo: vendor?.logo || null,
          orders: s._count.id,
          revenue: s._sum.total ?? 0,
          vendorEarnings: s._sum.vendorAmount ?? 0,
          commission: s._sum.commission ?? 0,
          topProducts: [],
        };
      });

      // H2: Fixed SQL injection — use Prisma.sql conditional fragments properly
      // The nested $queryRaw inside a $queryRaw template was bypassing parameterization.
      const vendorFilter = input.vendorId
        ? Prisma.sql`AND "vendorId" = ${input.vendorId}`
        : Prisma.empty;

      const monthlyBreakdown = await ctx.prisma.$queryRaw<Array<{ month: string; revenue: number; orders: number }>>`
        SELECT
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
          CAST(SUM("total") AS FLOAT8) as revenue,
          CAST(COUNT(*) AS INTEGER) as orders
        FROM "Order"
        WHERE "paymentStatus" = 'PAID'
          AND "createdAt" >= ${since}
          ${vendorFilter}
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

      const [orderAgg, topVendors] = await Promise.all([
        ctx.prisma.order.aggregate({
          where: { paymentStatus: 'PAID', createdAt: { gte: since } },
          _sum: { total: true, commission: true },
          _count: { id: true },
        }),
        ctx.prisma.order.groupBy({
          by: ['vendorId'],
          where: { paymentStatus: 'PAID', createdAt: { gte: since } },
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 5,
        }),
      ]);

      let newUsers = 0;
      let newVendors = 0;
      try {
        [newUsers, newVendors] = await Promise.all([
          ctx.prisma.user.count({ where: { createdAt: { gte: since }, role: 'CUSTOMER' } }),
          ctx.prisma.vendor.count({ where: { createdAt: { gte: since } } }),
        ]);
      } catch (e) {
        console.error('[PlatformAnalytics] Counts failed:', e);
      }


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
      const existingVendor = await ctx.prisma.vendor.findUnique({ where: { id: input.vendorId } });
      
      if (input.status === 'APPROVED' && existingVendor?.subscriptionStatus === 'NONE') {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Vendor must pay ₹700 admission fee before approval. Please ensure payment is completed via PhonePe or confirmed manually.' 
        });
      }

      const vendor = await ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: {
          status: input.status,
          commissionRate: input.commissionRate,
        },
      });

      // Trigger Pusher for Admin dashboard refresh
      try {
        const { pusherServer, CHANNELS, EVENTS } = await import('@/lib/pusher');
        await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.VENDOR_APPROVED, { vendorId: vendor.id, status: vendor.status });
      } catch (err) {
        console.error('[Admin] Pusher trigger failed:', err);
      }

      await logActivity({
        type: 'VENDOR',
        action: input.status === 'APPROVED' ? 'APPROVAL' : 'STATUS_UPDATE',
        entityId: vendor.id,
        entityType: 'Vendor',
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Vendor ${vendor.shopName} status updated to ${input.status}`,
        metadata: { status: input.status, commissionRate: input.commissionRate },
      });

      return vendor;

    }),


  confirmVendorPayment: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.update({
        where: { id: input.vendorId },
        data: { 
          status: 'APPROVED',
          subscriptionStatus: 'ACTIVE',
          plan: 'PREMIUM',
          planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
      });

      // Trigger Pusher for Admin dashboard refresh
      try {
        const { pusherServer, CHANNELS, EVENTS } = await import('@/lib/pusher');
        await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_PAYMENT_VERIFICATION, { vendorId: vendor.id });
      } catch (err) {
        console.error('[Admin] Pusher trigger failed:', err);
      }

      await logActivity({
        type: 'VENDOR',
        action: 'SUBSCRIPTION',
        entityId: vendor.id,
        entityType: 'Vendor',
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin manually confirmed ₹700 admission payment for ${vendor.shopName}`,
      });


      return vendor;
    }),


  updateVendor: adminProcedure
    .input(z.object({
      id: z.string(),
      shopName: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      category: z.string().optional(),
      commissionRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const vendor = await ctx.prisma.vendor.update({
        where: { id },
        data,
      });

      await logActivity({
        type: 'VENDOR',
        action: 'UPDATE',
        entityId: id,
        entityType: 'Vendor',
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin updated vendor details for ${vendor.shopName}`,
        metadata: data,
      });

      return vendor;
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
        where: { status: status },
        include: {
          user: { select: { name: true, email: true } },
          vendor: { select: { shopName: true, city: true } },
          items: { take: 3, select: { name: true, price: true } },
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
            // M2: Use enum value (matches PayoutStatus.COMPLETED)
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
    const keys = ['business_whatsapp', 'delivery_partners', 'delivery_fee', 'free_delivery_above', 'platform_fixed_fee'];
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
          vendor: { select: { shopName: true, city: true, commissionRate: true } },
          category: { select: { name: true, commissionRate: true } },
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
        commissionRate: z.number().min(0).max(1).optional(),
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
          commissionRate: input.commissionRate,
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.product.update({
        where: { id },
        data,
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
        coordinates: z.any().optional(),
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
        coordinates: z.any().optional(),
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

  // ─── CATEGORY MANAGEMENT ───────────────────────────────────────────────
  
  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().min(2),
        image: z.string().url(),
        description: z.string().optional(),
        sortOrder: z.number().int().default(0),
        commissionRate: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
        commissionRate: z.number().min(0).max(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.category.update({ where: { id }, data });
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

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status,
            deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
            timeline: {
              create: { status, message: messages[status] },
            },
          },
        });

        if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
          await tx.vendor.update({
            where: { id: order.vendorId },
            data: {
              pendingPayout: { increment: order.vendorAmount },
            },
          });
        }

        return updatedOrder;
      });

      // M3: Pusher wrapped in try/catch — admin action is not rolled back if notify fails
      try {
        await pusherServer.trigger(
          CHANNELS.ORDER(orderId),
          EVENTS.ORDER_STATUS_UPDATED,
          { status, message: messages[status] }
        );
      } catch (pusherErr) {
        console.error('[Admin] Pusher notify failed for order:', orderId, pusherErr);
      }

      await logActivity({
        type: 'ORDER',
        action: 'STATUS_UPDATE',
        entityId: orderId,
        entityType: 'Order',
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Order #${orderId.slice(-6)} status updated to ${status}`,
        metadata: { status },
      });

      return updated;
    }),


  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot delete your own admin account.' });
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });

      // Delete from Clerk first so the user cannot sign back in and recreate the DB record
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        await clerk.users.deleteUser(user.clerkId);
      } catch (err) {
        console.error('[Admin] Failed to delete Clerk user:', err);
        // If Clerk deletion fails, abort so we don't have an orphaned DB record
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete user from auth provider. Please try again.' });
      }

      await ctx.prisma.user.delete({ where: { id: input.userId } });

      await logActivity({
        type: 'USER',
        action: 'DELETE',
        entityId: input.userId,
        entityType: 'User',
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        message: `Admin deleted user account for ${user.name} (${user.email})`,
      });

      return { success: true };
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

  createVendor: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        shopName: z.string().min(3),
        description: z.string().optional(),
        phone: z.string(),
        email: z.string().email(),
        city: z.string(),
        address: z.string(),
        category: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: { vendor: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      const existingVendor = await ctx.prisma.vendor.findUnique({
        where: { userId: input.userId },
      });

      if (existingVendor) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This user is already a vendor.' });
      }

      // 1. Update User Role in DB and Clerk
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: 'VENDOR' },
      });

      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.clerkId, {
          publicMetadata: { role: 'VENDOR' }
        });
      } catch (err) {
        console.error('[Admin] Failed to sync Clerk metadata for new vendor:', err);
      }

      // 2. Create Vendor Profile
      return ctx.prisma.vendor.create({
        data: {
          userId: input.userId,
          shopName: input.shopName,
          description: input.description,
          phone: input.phone,
          email: input.email.toLowerCase(),
          city: input.city,
          address: input.address,
          categories: [input.category],
          status: 'APPROVED',
        },
      });
    }),


  /** ─── Payment & Subscription Verification ────────────────────────── */

  getPendingVerifications: adminProcedure.query(async ({ ctx }) => {
    const pendingOrders = await ctx.prisma.order.findMany({
      where: { paymentStatus: 'PENDING', utrNumber: { not: null } },
      include: { user: { select: { name: true } }, vendor: { select: { shopName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    const pendingSubscriptions = await ctx.prisma.vendor.findMany({
      where: { subscriptionStatus: 'PENDING_APPROVAL' },
      include: { user: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    
    return { pendingOrders, pendingSubscriptions };
  }),


  approvePayment: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
       const existingOrder = await ctx.prisma.order.findUnique({
         where: { id: input.orderId },
         select: { vendorId: true, vendorAmount: true, paymentStatus: true }
       });
       if (!existingOrder) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });

       return ctx.prisma.$transaction(async (tx) => {
         const order = await tx.order.update({
           where: { id: input.orderId },
           data: {
             paymentStatus: 'PAID',
             status: 'CONFIRMED',
             timeline: {
               create: {
                 status: 'CONFIRMED',
                 message: 'Payment verified manually by admin. Order confirmed.'
               }
             }
           }
         });

         // Credit vendor's pending payout — this path was previously missing this step
         if (existingOrder.paymentStatus !== 'PAID') {
           await tx.vendor.update({
             where: { id: existingOrder.vendorId },
             data: { pendingPayout: { increment: existingOrder.vendorAmount } },
           });
         }

         return order;
       });
    }),


  approveSubscription: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
       return await ctx.prisma.vendor.update({
         where: { id: input.vendorId },
         data: {
           plan: 'PREMIUM',
           subscriptionStatus: 'ACTIVE',
           subscriptionPaidAt: new Date(),
           planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
         }
       });
    }),
});