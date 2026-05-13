// src/server/routers/cart.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const cartRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!cart) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return { items: cart.items, total, itemCount };
  }),

  addItem: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, quantity } = input;

      const product = await ctx.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || !product.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Product is not available.",
        });
      }

      if (product.stock < quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${product.stock} units available.`,
        });
      }

      const cart = await ctx.prisma.cart.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id },
        update: {},
      });

      const existingItem = await ctx.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (product.stock < newQty) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only ${product.stock} units available (${existingItem.quantity} already in cart).`,
          });
        }
        return ctx.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: quantity } },
        });
      } else {
        return ctx.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }
    }),

  updateQuantity: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, quantity } = input;
      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!cart) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart not found." });
      }

      if (quantity === 0) {
        return ctx.prisma.cartItem.delete({
          where: { cartId_productId: { cartId: cart.id, productId } },
        });
      }

      const product = await ctx.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product || product.stock < quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${product?.stock ?? 0} units available.`,
        });
      }

      return ctx.prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity },
      });
    }),

  removeItem: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!cart) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart not found." });
      }
      await ctx.prisma.cartItem.delete({
        where: {
          cartId_productId: { cartId: cart.id, productId: input.productId },
        },
      });
      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.user.id },
    });
    if (cart) {
      await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { success: true };
  }),

  // H1: sync now validates all products before upserting
  sync: protectedProcedure
    .input(
      z.array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().min(1),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) return { success: true, skipped: [] };

      // Batch-fetch all products to validate in a single query
      const productIds = input.map((i) => i.productId);
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      const validItems: typeof input = [];
      const skipped: string[] = [];

      for (const item of input) {
        const product = productMap.get(item.productId);
        if (!product || !product.isActive || product.stock < 1) {
          skipped.push(item.productId);
          continue;
        }
        // Cap quantity at available stock
        validItems.push({
          productId: item.productId,
          quantity: Math.min(item.quantity, product.stock),
        });
      }

      if (validItems.length === 0) {
        return { success: true, skipped };
      }

      const cart = await ctx.prisma.cart.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id },
        update: {},
      });

      for (const item of validItems) {
        await ctx.prisma.cartItem.upsert({
          where: {
            cartId_productId: { cartId: cart.id, productId: item.productId },
          },
          create: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          },
          update: {
            quantity: item.quantity,
          },
        });
      }

      return { success: true, skipped };
    }),
});
