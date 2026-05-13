import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const walletRouter = createTRPCRouter({
  getTransactions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.walletTransaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { walletBalance: true },
    });
    return user?.walletBalance ?? 0;
  }),

  // Add money to wallet with bonus logic
  addMoney: protectedProcedure
    .input(z.object({
      amount: z.number().min(10),
      transactionId: z.string().optional(), // For manual tracking
    }))
    .mutation(async ({ ctx, input }) => {
      const { amount } = input;
      
      // Bonus logic: Pay 100, get 110 (10% bonus)
      // We'll generalize this: bonus = floor(amount / 100) * 10
      const bonus = Math.floor(amount / 100) * 10;
      const totalToCredit = amount + bonus;

      return await ctx.prisma.$transaction(async (tx) => {
        // 1. Update user balance
        await tx.user.update({
          where: { id: ctx.user.id },
          data: { walletBalance: { increment: totalToCredit } }
        });

        // 2. Log transaction
        return tx.walletTransaction.create({
          data: {
            userId: ctx.user.id,
            amount: totalToCredit,
            type: TransactionType.RECHARGE,
            status: TransactionStatus.COMPLETED,
            description: `Wallet top-up of ₹${amount}${bonus > 0 ? \` with ₹\${bonus} bonus\` : ''}`,
            reference: input.transactionId,
          }
        });
      });
    }),
});
