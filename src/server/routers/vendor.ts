// src/server/routers/vendor.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, vendorProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { uploadImage } from '@/lib/cloudinary';


export const vendorRouter = createTRPCRouter({
  register: protectedProcedure
    .input(
      z.object({
        shopName: z.string().min(3),
        description: z.string().min(10),
        phone: z.string().min(10),
        email: z.string().email(),
        city: z.string(),
        address: z.string(),
        category: z.string(),
        logo: z.string().startsWith('data:image/').optional(),
        // Bank Details
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        upiId: z.string().optional(),
        // GST
        gstNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingVendor = await ctx.prisma.vendor.findUnique({
        where: { userId: ctx.user.id },
      });
      if (existingVendor) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already registered as a vendor.' });
      }

      let logoUrl: string | undefined = undefined;
      if (input.logo) {
        logoUrl = await uploadImage(input.logo, 'vendors/logos');
      }

      const [vendor] = await ctx.prisma.$transaction([
        ctx.prisma.vendor.create({
          data: {
            userId: ctx.user.id,
            shopName: input.shopName,
            description: input.description,
            phone: input.phone,
            email: input.email,
            city: input.city,
            address: input.address,
            category: input.category,
            logo: logoUrl,
            // Bank Details
            bankAccount: input.bankAccount,
            bankAccountName: input.bankAccountName,
            bankName: input.bankName,
            ifscCode: input.ifscCode,
            upiId: input.upiId,
            gstNumber: input.gstNumber,
          },
        }),
        ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: { role: 'VENDOR' },
        }),
      ]);


      return vendor;
    }),


  myProfile: vendorProcedure.query(async ({ ctx }) => {
    return ctx.prisma.vendor.findUnique({
      where: { id: ctx.vendor.id },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });
  }),


  updateProfile: vendorProcedure
    .input(
      z.object({
        shopName: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        phone: z.string().min(10).optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        category: z.string().optional(),
        // Bank details
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        upiId: z.string().optional(),
        // GST
        gstNumber: z.string().optional(),
        // Images
        logo: z.string().startsWith('data:image/').optional(),
        coverImage: z.string().startsWith('data:image/').optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { logo, coverImage, ...updateData } = input;

      let logoUrl: string | undefined = undefined;
      if (logo) {
        logoUrl = await uploadImage(logo, 'vendors/logos');
      }
      let coverImageUrl: string | undefined = undefined;
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage, 'vendors/covers');
      }

      return ctx.prisma.vendor.update({
        where: { id: ctx.vendor.id },
        data: {
          ...updateData,
          logo: logoUrl ?? ctx.vendor.logo,
          coverImage: coverImageUrl ?? ctx.vendor.coverImage,
        },
      });
    }),


  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.id, status: 'APPROVED' },
        include: {
          products: {
            where: { isActive: true },
            include: { category: true },
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!vendor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found.' });
      }
      return vendor;
    }),


  myAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.address.findMany({
      where: { userId: ctx.user.id },
      orderBy: { isDefault: 'desc' },
    });
  }),


  addAddress: protectedProcedure
    .input(
      z.object({
        label: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        pincode: z.string(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isDefault) {
        await ctx.prisma.address.updateMany({
          where: { userId: ctx.user.id },
          data: { isDefault: false },
        });
      }
      return ctx.prisma.address.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),


  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const address = await ctx.prisma.address.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!address) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Address not found.' });
      }
      await ctx.prisma.address.delete({ where: { id: input.id } });
      return { success: true };
    }),
});