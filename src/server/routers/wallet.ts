import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TransactionType, TransactionStatus, PointsTransactionType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const walletRouter = createTRPCRouter({
  getTransactions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.walletTransaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { walletBalance: true },
    });
    return user?.walletBalance ?? 0;
  }),

  isWelcomeOfferEligible: protectedProcedure.query(async ({ ctx }) => {
    const completedRechargesCount = await ctx.prisma.walletTransaction.count({
      where: {
        userId: ctx.user.id,
        type: TransactionType.RECHARGE,
        status: TransactionStatus.COMPLETED,
      },
    });
    return completedRechargesCount === 0;
  }),

  getRedeemPoints: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { redeemPoints: true },
    });
    return user?.redeemPoints ?? 0;
  }),

  getRedeemTransactions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.pointsTransaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Add money to wallet with bonus logic (restricted as a welcome offer)
  addMoney: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(10),
        transactionId: z.string().optional(), // For manual tracking
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { amount } = input;

      // Check if user is eligible for welcome offer (first recharge only)
      const completedRechargesCount = await ctx.prisma.walletTransaction.count({
        where: {
          userId: ctx.user.id,
          type: TransactionType.RECHARGE,
          status: TransactionStatus.COMPLETED,
        },
      });
      const isWelcomeOfferEligible = completedRechargesCount === 0;

      // Bonus logic: Pay 100, get 110 (10% bonus) ONLY for welcome offer
      const bonus = isWelcomeOfferEligible ? Math.floor(amount / 100) * 10 : 0;
      const totalToCredit = amount + bonus;

      return await ctx.prisma.$transaction(async (tx) => {
        // 1. Update user balance
        await tx.user.update({
          where: { id: ctx.user.id },
          data: { walletBalance: { increment: totalToCredit } },
        });

        // 2. Log transaction
        return tx.walletTransaction.create({
          data: {
            userId: ctx.user.id,
            amount: totalToCredit,
            type: TransactionType.RECHARGE,
            status: TransactionStatus.COMPLETED,
            description: `Wallet top-up of ₹${amount}${bonus > 0 ? ` with ₹${bonus} welcome bonus` : ""}`,
            reference: input.transactionId,
          },
        });
      });
    }),

  // Redeem points to wallet balance (1 point = ₹1)
  redeemPoints: protectedProcedure
    .input(
      z.object({
        points: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { points } = input;

      return await ctx.prisma.$transaction(async (tx) => {
        // 1. Fetch user points
        const user = await tx.user.findUnique({
          where: { id: ctx.user.id },
          select: { redeemPoints: true },
        });

        if (!user || user.redeemPoints < points) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient redeem points balance.",
          });
        }

        // 2. Deduct points and credit wallet balance (1:1 conversion)
        await tx.user.update({
          where: { id: ctx.user.id },
          data: {
            redeemPoints: { decrement: points },
            walletBalance: { increment: points },
          },
        });

        // 3. Log points transaction
        await tx.pointsTransaction.create({
          data: {
            userId: ctx.user.id,
            points: -points,
            type: PointsTransactionType.REDEEMED,
            description: `Redeemed ${points} points to wallet cash`,
          },
        });

        // 4. Log wallet transaction
        await tx.walletTransaction.create({
          data: {
            userId: ctx.user.id,
            amount: points,
            type: TransactionType.BONUS,
            status: TransactionStatus.COMPLETED,
            description: `Redeemed points conversion of ₹${points}`,
          },
        });

        // 5. Create system notification
        await tx.notification.create({
          data: {
            userId: ctx.user.id,
            title: "Points Redeemed! 🎉",
            message: `Successfully converted ${points} redeem points to ₹${points} wallet cash.`,
            type: "SYSTEM",
            link: "/wallet/redeem",
          },
        });

        return { success: true, redeemed: points };
      });
    }),
});

