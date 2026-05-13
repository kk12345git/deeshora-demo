import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

export const communityRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.community.findMany({
        take: (input.limit ?? 10) + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > (input.limit ?? 10)) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.findUnique({
        where: { id: input.id },
        include: {
          posts: { orderBy: { createdAt: 'desc' }, take: 20 },
          _count: { select: { members: true } },
        },
      });

      if (!community) throw new TRPCError({ code: 'NOT_FOUND' });
      
      let isMember = false;
      if (ctx.userId) {
        const membership = await ctx.prisma.communityMember.findUnique({
          where: { communityId_userId: { communityId: input.id, userId: ctx.userId } }
        });
        isMember = !!membership;
      }

      return { ...community, isMember };
    }),

  join: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.communityMember.create({
        data: {
          communityId: input.communityId,
          userId: ctx.userId,
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.communityMember.delete({
        where: { communityId_userId: { communityId: input.communityId, userId: ctx.userId } },
      });
    }),
});
