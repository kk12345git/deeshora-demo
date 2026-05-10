import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, vendorProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { uploadImage } from '@/lib/cloudinary';
import { initiatePhonePePayment } from '@/lib/payments/phonepe';


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
        categories: z.array(z.string()),
        logo: z.string().startsWith('data:image/').optional(),
        // Bank Details
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        upiId: z.string().optional(),
        upiQrCode: z.string().startsWith('data:image/').optional(),
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
      let upiQrCodeUrl: string | undefined = undefined;
      if (input.upiQrCode) {
        upiQrCodeUrl = await uploadImage(input.upiQrCode, 'vendors/upiqr');
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
            categories: input.categories,
            logo: logoUrl,
            // Bank Details
            bankAccount: input.bankAccount,
            bankAccountName: input.bankAccountName,
            bankName: input.bankName,
            ifscCode: input.ifscCode,
            upiId: input.upiId,
            upiQrCode: upiQrCodeUrl,
            gstNumber: input.gstNumber,
          },
        }),
        ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: { role: 'VENDOR' },
        }),
      ]);

      // Sync Clerk publicMetadata so the Navbar role badge updates immediately
      // without waiting for the next webhook event
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(ctx.user.clerkId, {
          publicMetadata: { role: 'VENDOR' },
        });
      } catch (err) {
        console.error('[Vendor] Failed to sync Clerk metadata after registration:', err);
        // Non-fatal — webhook will sync on next Clerk event
      }

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
        categories: z.array(z.string()).optional(),
        // Bank details
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        upiId: z.string().optional(),
        upiQrCode: z.string().startsWith('data:image/').optional(),
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
      let upiQrCodeUrl: string | undefined = undefined;
      if (input.upiQrCode) {
        upiQrCodeUrl = await uploadImage(input.upiQrCode, 'vendors/upiqr');
      }

      return ctx.prisma.vendor.update({
        where: { id: ctx.vendor.id },
        data: {
          ...updateData,
          logo: logoUrl ?? ctx.vendor.logo,
          coverImage: coverImageUrl ?? ctx.vendor.coverImage,
          upiQrCode: upiQrCodeUrl ?? ctx.vendor.upiQrCode,
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


  // App is real-time live process - subscription system
  initiateSubscription: vendorProcedure
    .input(z.object({ planId: z.string().optional() }))
    .mutation(async ({ ctx }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: ctx.vendor.id },
      });

      if (!vendor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found' });
      }

      // 1. Create a payment request for ₹700
      const paymentRes = await initiatePhonePePayment({
        orderId: `SUB_${vendor.id.slice(-6)}_${Date.now()}`,
        amount: 700,
        customerEmail: vendor.email,
        customerPhone: vendor.phone,
        customerName: vendor.shopName,
        callbackUrl: '', // Hardcoded in implementation
      });

      if (!paymentRes.success || !paymentRes.redirectUrl) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: paymentRes.message || 'Failed to initiate PhonePe payment' 
        });
      }

      // 2. Mark as pending approval/verification and store transaction ID
      await ctx.prisma.vendor.update({
        where: { id: ctx.vendor.id },
        data: {
          subscriptionStatus: 'PENDING_APPROVAL',
          subscriptionMethod: 'PHONEPE',
          lastPaymentId: paymentRes.paymentId, // Store the merchantTransactionId
        }
      });

      return {
        redirectUrl: paymentRes.redirectUrl,
      };
    }),

  submitManualPayment: vendorProcedure
    .input(z.object({ utr: z.string().min(6) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vendor.update({
        where: { id: ctx.vendor.id },
        data: {
          subscriptionStatus: 'PENDING_APPROVAL',
          subscriptionUtr: input.utr,
          subscriptionMethod: 'MANUAL_UPI',
        }
      });
    }),

  getSubscriptionStatus: vendorProcedure.query(async ({ ctx }) => {
    const vendor = await ctx.prisma.vendor.findUnique({
      where: { id: ctx.vendor.id },
      select: {
        plan: true,
        planExpiresAt: true,
        subscriptionStatus: true,
      }
    });

    if (!vendor) return null;

    const isExpired = vendor.planExpiresAt ? new Date() > new Date(vendor.planExpiresAt) : true;
    const daysRemaining = vendor.planExpiresAt 
      ? Math.max(0, Math.ceil((new Date(vendor.planExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      ...vendor,
      isExpired: vendor.plan === 'TRIAL' ? false : isExpired,
      daysRemaining,
    };
  }),
});