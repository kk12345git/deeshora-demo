import { z } from 'zod';
import { createTRPCRouter, adminProcedure, publicProcedure } from '@/server/trpc';
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


  updateConfig: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.siteConfig.update({
        where: { key: input.key },
        data: { value: input.value },
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
});