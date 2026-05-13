import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

export const deliverySlotRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.deliverySlot.findMany({
      where: {},
      orderBy: { startTime: "asc" },
    });
  }),
});
