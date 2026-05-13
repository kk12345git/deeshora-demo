import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const vendorRouter = createTRPCRouter({
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const vendor = await ctx.prisma.vendor.findUnique({
      where: { userId: ctx.auth.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
            phone: true,
          }
        }
      }
    });

    if (!vendor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vendor profile not found",
      });
    }

    return vendor;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      shopName: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      upiId: z.string().optional(),
      bankAccount: z.string().optional(),
      ifscCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vendor.update({
        where: { userId: ctx.auth.userId },
        data: input,
      });
    }),
});
