// src/server/routers/product.ts
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, vendorProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { uploadImage } from '@/lib/cloudinary';
import slugify from 'slugify';


export const productRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        categorySlug: z.string().optional(),
        vendorId: z.string().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
        city: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 12;
      const { cursor, categorySlug, vendorId, search, featured, city } = input;


      const items = await ctx.prisma.product.findMany({
        take: limit + 1,
        where: {
          isActive: true,
          category: categorySlug ? { slug: categorySlug } : undefined,
          vendor: {
            city: city ? { equals: city, mode: 'insensitive' } : undefined,
            id: vendorId,
          },
          isFeatured: featured,
          OR: search
            ? [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        include: {
          vendor: { select: { shopName: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });


      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }


      return {
        products: items,
        nextCursor,
      };
    }),


  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id, isActive: true },
        include: {
          vendor: true,
          category: true,
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, avatar: true } } },
          },
        },
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
      }
      return product;
    }),


  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { slug: input.slug, isActive: true },
        include: {
          vendor: true,
          category: true,
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, avatar: true } } },
          },
        },
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
      }
      return product;
    }),


  categories: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }),


  getCities: publicProcedure.query(async ({ ctx }) => {
    const vendors = await ctx.prisma.vendor.findMany({
      where: { status: 'APPROVED' },
      select: { city: true },
      distinct: ['city'],
    });
    return vendors.map(v => v.city).filter(Boolean).sort();
  }),


  create: vendorProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().min(10),
        price: z.number().positive(),
        mrp: z.number().positive(),
        stock: z.number().int().min(0),
        unit: z.string(),
        categoryId: z.string(),
        images: z.array(z.string().startsWith('data:image/')).min(1),
        isFeatured: z.boolean().optional(),
        gstRate: z.number().min(0).max(0.28).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.vendor.status !== 'APPROVED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your vendor account is not approved.' });
      }


      const imageUrls = await Promise.all(
        input.images.map((base64) => uploadImage(base64, 'products'))
      );


      const slug = `${slugify(input.name, { lower: true, strict: true })}-${Date.now()}`;


      const product = await ctx.prisma.product.create({
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
          gstRate: input.gstRate,
          vendorId: ctx.vendor.id,
        },
      });
      return product;
    }),


  update: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        price: z.number().positive().optional(),
        mrp: z.number().positive().optional(),
        stock: z.number().int().min(0).optional(),
        unit: z.string().optional(),
        categoryId: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        gstRate: z.number().min(0).max(0.28).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({
        where: { id: input.id, vendorId: ctx.vendor.id },
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found or you do not own it.' });
      }


      return ctx.prisma.product.update({
        where: { id: input.id },
        data: { ...input },
      });
    }),


  delete: vendorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({
        where: { id: input.id, vendorId: ctx.vendor.id },
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found or you do not own it.' });
      }
      await ctx.prisma.product.delete({ where: { id: input.id } });
      return { success: true };
    }),


  vendorProducts: vendorProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;
      const items = await ctx.prisma.product.findMany({
        take: limit + 1,
        where: { vendorId: ctx.vendor.id },
        include: { category: { select: { name: true } } },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });


      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }
      return { products: items, nextCursor };
    }),


  addReview: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has purchased this product
      const hasPurchased = await ctx.prisma.order.findFirst({
        where: {
          userId: ctx.user.id,
          status: 'DELIVERED',
          items: { some: { productId: input.productId } },
        },
      });
      if (!hasPurchased) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only review products you have purchased.' });
      }


      const newReview = await ctx.prisma.review.create({
        data: {
          productId: input.productId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
        },
      });


      // Recalculate product rating
      const stats = await ctx.prisma.review.aggregate({
        where: { productId: input.productId },
        _avg: { rating: true },
        _count: { id: true },
      });


      await ctx.prisma.product.update({
        where: { id: input.productId },
        data: {
          rating: stats._avg.rating ?? 0,
          reviewCount: stats._count.id,
        },
      });


      return newReview;
    }),
});