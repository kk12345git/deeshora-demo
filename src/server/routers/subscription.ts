import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const subscriptionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        addressId: z.string(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
        quantity: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Calculate nextOrder date based on frequency
      const nextOrder = new Date();
      if (input.frequency === "DAILY")
        nextOrder.setDate(nextOrder.getDate() + 1);
      else if (input.frequency === "WEEKLY")
        nextOrder.setDate(nextOrder.getDate() + 7);
      else if (input.frequency === "MONTHLY")
        nextOrder.setMonth(nextOrder.getMonth() + 1);

      return ctx.prisma.orderSubscription.create({
        data: {
          userId: ctx.user.id,
          productId: input.productId,
          addressId: input.addressId,
          frequency: input.frequency,
          quantity: input.quantity,
          nextOrder,
        },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.orderSubscription.findMany({
      where: { userId: ctx.user.id },
      include: {
        product: {
          select: {
            name: true,
            images: true,
            price: true,
            mrp: true,
          },
        },
        address: {
          select: {
            label: true,
            line1: true,
            city: true,
          },
        },
      },
      orderBy: { nextOrder: "asc" },
    });
  }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.orderSubscription.findUnique({
        where: { id: input.id },
      });

      if (!sub || sub.userId !== ctx.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.prisma.orderSubscription.update({
        where: { id: input.id },
        data: { isActive: !sub.isActive },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.orderSubscription.findUnique({
        where: { id: input.id },
      });

      if (!sub || sub.userId !== ctx.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.prisma.orderSubscription.delete({
        where: { id: input.id },
      });
    }),
});
