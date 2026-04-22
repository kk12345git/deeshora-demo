// src/server/routers/product.ts
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, vendorProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { uploadImage } from '@/lib/cloudinary';
import slugify from 'slugify';

// M4: Max 2MB per base64 image (base64 has ~33% overhead, so 2MB raw ≈ 2.7MB base64)
const MAX_IMAGE_BASE64_BYTES = 2.7 * 1024 * 1024;


// ─── Category keyword map for auto-analysis ──────────────────────────────────
// Maps keywords in a product name to a category name (case-insensitive)
const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  'Groceries':    ['rice', 'dal', 'flour', 'atta', 'oil', 'salt', 'sugar', 'turmeric', 'spice', 'masala', 'pulses', 'lentil', 'wheat', 'cereal', 'grain', 'maida'],
  'Vegetables':   ['tomato', 'potato', 'onion', 'carrot', 'spinach', 'cabbage', 'brinjal', 'capsicum', 'peas', 'beans', 'cucumber', 'gourd', 'bitter', 'drumstick', 'ladies finger', 'okra', 'garlic', 'ginger', 'coriander', 'mint', 'vegetable', 'sabzi', 'greens'],
  'Fruits':       ['apple', 'mango', 'banana', 'orange', 'grape', 'papaya', 'watermelon', 'melon', 'pomegranate', 'guava', 'pineapple', 'strawberry', 'lemon', 'kiwi', 'pear', 'fruit'],
  'Dairy':        ['milk', 'curd', 'paneer', 'butter', 'ghee', 'cheese', 'cream', 'yogurt', 'lassi', 'buttermilk', 'khoya', 'mawa', 'dairy'],
  'Bakery':       ['bread', 'cake', 'biscuit', 'cookie', 'muffin', 'croissant', 'rusk', 'toast', 'pastry', 'brownie', 'donut', 'pav', 'bun', 'pizza'],
  'Beverages':    ['water', 'juice', 'cola', 'soda', 'tea', 'coffee', 'milk shake', 'smoothie', 'energy drink', 'cold drink', 'lemonade', 'nimbu pani', 'chaas', 'tender coconut', 'drink', 'beverage'],
  'Meat & Seafood': ['chicken', 'mutton', 'fish', 'prawn', 'egg', 'meat', 'seafood', 'crab', 'lobster', 'sardine', 'tuna', 'salmon', 'beef', 'pork', 'sausage', 'keema'],
  'Snacks':       ['chips', 'namkeen', 'bhujia', 'mixture', 'popcorn', 'biscuit', 'cracker', 'wafer', 'fries', 'snack', 'peanut', 'cashew', 'almond', 'raisin', 'dry fruit'],
  'Personal Care': ['shampoo', 'soap', 'conditioner', 'face wash', 'moisturizer', 'lotion', 'cream', 'toothpaste', 'toothbrush', 'deodorant', 'perfume', 'body wash', 'sunscreen', 'serum'],
  'Cleaning':     ['detergent', 'phenyl', 'toilet cleaner', 'floor cleaner', 'dish wash', 'broom', 'mop', 'tissue', 'wipe', 'sanitizer', 'bleach', 'vim', 'harpic', 'surf'],
  'Electronics':  ['mobile', 'phone', 'charger', 'cable', 'earphone', 'headphone', 'speaker', 'bulb', 'led', 'fan', 'battery', 'adapter', 'usb', 'laptop', 'tablet', 'remote', 'electronic'],
  'Stationery':   ['pen', 'pencil', 'notebook', 'paper', 'book', 'eraser', 'stapler', 'tape', 'scissors', 'marker', 'highlighter', 'folder', 'stationery'],
};

function autoDetectCategory(name: string, description: string = ''): string | null {
  const text = `${name} ${description}`.toLowerCase();
  let bestMatch: { category: string; score: number } | null = null;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        // Exact word boundary match scores higher
        score += text.includes(` ${kw} `) || text.startsWith(kw) ? 2 : 1;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }
  return bestMatch?.category ?? null;
}


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
        sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 12;
      const { cursor, categorySlug, vendorId, search, featured, city, sortBy } = input;

      const orderBy = sortBy === 'price_asc'  ? { price: 'asc' as const }
                    : sortBy === 'price_desc' ? { price: 'desc' as const }
                    : sortBy === 'rating'     ? { rating: 'desc' as const }
                    : sortBy === 'popular'    ? { viewCount: 'desc' as const }
                    : { createdAt: 'desc' as const };

      const items = await ctx.prisma.product.findMany({
        take: limit + 1,
        where: {
          isActive: true,
          category: categorySlug ? { slug: categorySlug } : undefined,
          vendor: {
            city: city ? { equals: city, mode: 'insensitive' } : undefined,
            id: vendorId,
            status: 'APPROVED',
          },
          isFeatured: featured,
          OR: search
            ? [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } },
              ]
            : undefined,
        },
        include: {
          vendor: { select: { shopName: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy,
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


  // ─── AI-style Search: returns exact + related in one call ─────────────────
  smartSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        city: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, city, limit } = input;
      const q = query.trim();

      const baseWhere = {
        isActive: true,
        vendor: {
          status: 'APPROVED' as const,
          city: city ? { equals: city, mode: 'insensitive' as const } : undefined,
        },
      };

      // 1. Exact name match
      const exactByName = await ctx.prisma.product.findMany({
        take: limit,
        where: {
          ...baseWhere,
          name: { contains: q, mode: 'insensitive' },
        },
        include: {
          vendor: { select: { shopName: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { rating: 'desc' },
      });

      // 2. Description + tags match (exclude already found)
      const exactIds = new Set(exactByName.map(p => p.id));
      const relatedByDesc = await ctx.prisma.product.findMany({
        take: limit,
        where: {
          ...baseWhere,
          id: { notIn: Array.from(exactIds) },
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { has: q.toLowerCase() } },
          ],
        },
        include: {
          vendor: { select: { shopName: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { rating: 'desc' },
      });

      // 3. Related: same category as top exact result (more discovery)
      let categoryRelated: typeof exactByName = [];
      if (exactByName.length > 0) {
        const topCategoryId = exactByName[0].categoryId;
        const relatedIds = new Set([...Array.from(exactIds), ...relatedByDesc.map(p => p.id)]);
        categoryRelated = await ctx.prisma.product.findMany({
          take: 8,
          where: {
            ...baseWhere,
            categoryId: topCategoryId,
            id: { notIn: Array.from(relatedIds) },
          },
          include: {
            vendor: { select: { shopName: true, city: true } },
            category: { select: { name: true, slug: true } },
          },
          orderBy: { rating: 'desc' },
        });
      }

      // Log search to analytics (non-blocking — fire and forget)
      ctx.prisma.searchLog.create({
        data: {
          query: q,
          userId: ctx.user?.id,
          results: exactByName.length + relatedByDesc.length,
          city,
        },
      }).catch(() => {}); // never throw on analytics failure

      return {
        exact: exactByName,
        related: [...relatedByDesc, ...categoryRelated],
        totalExact: exactByName.length,
      };
    }),


  // ─── Typeahead suggestions (fast — name only) ─────────────────────────────
  suggest: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(60),
        city: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, city } = input;
      if (query.trim().length < 2) return [];

      const results = await ctx.prisma.product.findMany({
        take: 6,
        where: {
          isActive: true,
          name: { contains: query.trim(), mode: 'insensitive' },
          vendor: {
            status: 'APPROVED',
            city: city ? { equals: city, mode: 'insensitive' } : undefined,
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          slug: true,
          category: { select: { name: true } },
        },
        orderBy: { rating: 'desc' },
      });
      return results;
    }),


  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({
        where: { id: input.id, isActive: true, vendor: { status: 'APPROVED' } },
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
      // Bump view count (fire and forget)
      ctx.prisma.product.update({ where: { id: input.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
      return product;
    }),


  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({
        where: { slug: input.slug, isActive: true, vendor: { status: 'APPROVED' } },
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
      ctx.prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
      return product;
    }),


  // ─── Related products for a given product ────────────────────────────────
  related: publicProcedure
    .input(z.object({ productId: z.string(), limit: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        select: { categoryId: true, vendorId: true },
      });
      if (!product) return [];

      return ctx.prisma.product.findMany({
        take: input.limit,
        where: {
          isActive: true,
          id: { not: input.productId },
          categoryId: product.categoryId,
          vendor: { status: 'APPROVED' },
        },
        include: {
          vendor: { select: { shopName: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { rating: 'desc' },
      });
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


  // L3: autoAnalyze moved to protectedProcedure — prevents unauthenticated rate-abuse on this DB endpoint
  autoAnalyze: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const detectedCategoryName = autoDetectCategory(input.name, input.description);

      if (!detectedCategoryName) {
        return { suggestedCategoryId: null, suggestedCategoryName: null, confidence: 'low' as const, hints: [] };
      }

      const category = await ctx.prisma.category.findFirst({
        where: { name: { contains: detectedCategoryName, mode: 'insensitive' }, isActive: true },
        select: { id: true, name: true },
      });

      // Generate description hints based on category
      const descriptionHints: string[] = [];
      const catLower = detectedCategoryName.toLowerCase();
      if (catLower.includes('vegetable') || catLower.includes('fruit')) {
        descriptionHints.push('Mention freshness: "Farm-fresh", "Harvested today"');
        descriptionHints.push('Add origin: "Grown in Tamil Nadu", "Local farm"');
        descriptionHints.push('Add weight/size info');
      } else if (catLower.includes('dairy')) {
        descriptionHints.push('Mention source: "From local farm", "A2 milk"');
        descriptionHints.push('Add fat percentage if applicable');
      } else if (catLower.includes('electronic')) {
        descriptionHints.push('Add brand, model, and warranty info');
        descriptionHints.push('List key specifications');
      } else if (catLower.includes('bakery')) {
        descriptionHints.push('Mention ingredients or allergens');
        descriptionHints.push('Add shelf life / best before info');
      } else {
        descriptionHints.push('Describe quality, source, and key features');
        descriptionHints.push('Add quantity, weight, or dimensions');
      }

      return {
        suggestedCategoryId: category?.id ?? null,
        suggestedCategoryName: category?.name ?? detectedCategoryName,
        confidence: category ? 'high' as const : 'medium' as const,
        hints: descriptionHints,
      };
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
        // M4: Validate image size server-side (max 2MB per image, up to 5 images)
        images: z.array(
          z.string()
            .startsWith('data:image/')
            .refine((s) => s.length <= MAX_IMAGE_BASE64_BYTES, 'Each image must be under 2MB')
        ).min(1).max(5),
        isFeatured: z.boolean().optional(),
        gstRate: z.number().min(0).max(0.28).default(0),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.vendor.status === 'SUSPENDED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your vendor account is suspended. Please contact support.' });
      }
      if (ctx.vendor.status === 'PENDING') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your vendor account is pending approval. You can add products once the admin approves your account.' });
      }

      const imageUrls = await Promise.all(
        input.images.map((base64) => uploadImage(base64, 'products'))
      );

      const slug = `${slugify(input.name, { lower: true, strict: true })}-${Date.now()}`;

      // Auto-generate tags from name if not provided
      const autoTags = input.tags?.length
        ? input.tags
        : input.name.toLowerCase().split(/\s+/).filter(t => t.length > 2);

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
          tags: autoTags,
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
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const product = await ctx.prisma.product.findFirst({
        where: { id, vendorId: ctx.vendor.id },
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found or you do not own it.' });
      }

      return ctx.prisma.product.update({
        where: { id },
        data: updateData,
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


  // ─── Vendor status check (to show banner before form) ─────────────────────
  myVendorStatus: vendorProcedure
    .query(async ({ ctx }) => {
      return {
        status: ctx.vendor.status,
        shopName: ctx.vendor.shopName,
      };
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

      // M1: Prevent duplicate reviews — one review per user per product
      const existingReview = await ctx.prisma.review.findUnique({
        where: { productId_userId: { productId: input.productId, userId: ctx.user.id } },
      });
      if (existingReview) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already reviewed this product. Edit your existing review instead.' });
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