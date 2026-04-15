// src/server/routers/cart.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';


export const cartRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: { select: { shopName: true } },
              },
            },
          },
          orderBy: { product: { vendorId: 'asc' } },
        },
      },
    });


    if (!cart) {
      return { items: [], total: 0, itemCount: 0 };
    }


    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);


    return { items: cart.items, total, itemCount };
  }),


  addItem: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, quantity } = input;


      const product = await ctx.prisma.product.findUnique({
        where: { id: productId },
      });


      if (!product || !product.isActive || product.stock < quantity) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Product is not available or out of stock.' });
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
        if (product.stock < existingItem.quantity + quantity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not enough stock available.' });
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, quantity } = input;
      const cart = await ctx.prisma.cart.findUnique({ where: { userId: ctx.user.id } });
      if (!cart) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cart not found.' });
      }


      if (quantity === 0) {
        return ctx.prisma.cartItem.delete({
          where: { cartId_productId: { cartId: cart.id, productId } },
        });
      }


      const product = await ctx.prisma.product.findUnique({ where: { id: productId } });
      if (!product || product.stock < quantity) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not enough stock available.' });
      }


      return ctx.prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity },
      });
    }),


  removeItem: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.prisma.cart.findUnique({ where: { userId: ctx.user.id } });
      if (!cart) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cart not found.' });
      }
      await ctx.prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
      });
      return { success: true };
    }),


  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({ where: { userId: ctx.user.id } });
    if (cart) {
      await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { success: true };
  }),


  sync: protectedProcedure
    .input(
      z.array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().min(1),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.prisma.cart.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id },
        update: {},
      });


      // Simple merge strategy: for each input item, upsert it in DB
      for (const item of input) {
        await ctx.prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
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


      return { success: true };
    }),
});