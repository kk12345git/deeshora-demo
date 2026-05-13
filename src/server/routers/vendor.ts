import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { uploadImage } from "@/lib/cloudinary";

export const vendorRouter = createTRPCRouter({
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const vendor = await ctx.prisma.vendor.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!vendor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vendor profile not found",
      });
    }

    return vendor;
  }),

  myVendorStatus: protectedProcedure.query(async ({ ctx }) => {
    const vendor = await ctx.prisma.vendor.findUnique({
      where: { userId: ctx.user.id },
      select: { status: true, shopName: true },
    });
    return vendor;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        shopName: z.string().optional(),
        description: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        upiId: z.string().optional(),
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        logo: z.string().optional(),
        coverImage: z.string().optional(),
        upiQrCode: z.string().optional(),
        gstNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { logo, coverImage, upiQrCode, ...rest } = input as any;
      const data = { ...rest };
      
      if (logo && logo.startsWith("data:image/")) {
        data.logo = await uploadImage(logo, "vendors");
      }
      if (coverImage && coverImage.startsWith("data:image/")) {
        data.coverImage = await uploadImage(coverImage, "vendors");
      }
      if (upiQrCode && upiQrCode.startsWith("data:image/")) {
        data.upiQrCode = await uploadImage(upiQrCode, "vendors");
      }

      return ctx.prisma.vendor.update({
        where: { userId: ctx.user.id },
        data,
      });
    }),

  register: protectedProcedure
    .input(
      z.object({
        shopName: z.string().min(3),
        description: z.string().min(10).optional(),
        phone: z.string(),
        email: z.string().email(),
        city: z.string(),
        address: z.string().optional(),
        categories: z.array(z.string()),
        logo: z.string().optional(),
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        upiId: z.string().optional(),
        upiQrCode: z.string().optional(),
        gstNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { logo, upiQrCode, ...rest } = input;
      
      let logoUrl = logo;
      if (logo && logo.startsWith("data:image/")) {
        logoUrl = await uploadImage(logo, "vendors");
      }
      
      let upiQrCodeUrl = upiQrCode;
      if (upiQrCode && upiQrCode.startsWith("data:image/")) {
        upiQrCodeUrl = await uploadImage(upiQrCode, "vendors");
      }

      const existing = await ctx.prisma.vendor.findUnique({
        where: { userId: ctx.user.id },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already registered as a vendor.",
        });
      }
      return ctx.prisma.vendor.create({
        data: {
          ...rest,
          logo: logoUrl,
          upiQrCode: upiQrCodeUrl,
          userId: ctx.user.id,
          status: "PENDING",
        },
      });
    }),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const vendor = await ctx.prisma.vendor.findUnique({
      where: { userId: ctx.user.id },
      select: { subscriptionStatus: true, subscriptionExpiresAt: true },
    });
    if (!vendor) return null;
    const isExpired = vendor.subscriptionExpiresAt ? vendor.subscriptionExpiresAt < new Date() : true;
    const daysRemaining = vendor.subscriptionExpiresAt 
      ? Math.max(0, Math.ceil((vendor.subscriptionExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    return {
      status: vendor.subscriptionStatus,
      isExpired,
      daysRemaining,
    };
  }),

  initiateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    return { redirectUrl: "/vendor/payouts" };
  }),

  submitManualPayment: protectedProcedure
    .input(z.object({ utr: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vendor.update({
        where: { userId: ctx.user.id },
        data: {
          subscriptionStatus: "PENDING",
          subscriptionUtr: input.utr,
        },
      });
    }),
});
