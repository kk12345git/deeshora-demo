// src/server/routers/vendor.ts
import { z } from 'zod';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';
import { createTRPCRouter, protectedProcedure, vendorProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { uploadImage } from '@/lib/cloudinary';
import { initiatePayment } from '@/lib/payments';


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
            categories: input.categories,
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
        categories: z.array(z.string()).optional(),
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


  // ─── Real Subscription Integration (₹700/month) ───────────────────────
  
  initiateSubscription: vendorProcedure
    .input(z.object({ provider: z.enum(['PHONEPE', 'MANUAL_UPI']) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await initiatePayment(input.provider, {
          orderId: `SUB_${ctx.vendor.id.slice(-6)}_${Date.now()}`,
          amount: 700,
          customerName: ctx.user.name,
          customerEmail: ctx.user.email,
          customerPhone: ctx.vendor.phone,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard`,
        });
      } catch (error) {
        console.error('[Vendor] Subscription initiation failed:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to initiate payment. Please try again.' 
        });
      }
    }),

  submitSubscriptionUtr: vendorProcedure
    .input(z.object({ utrNumber: z.string().min(12, 'UTR must be at least 12 digits') }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.vendor.update({
        where: { id: ctx.vendor.id },
        data: {
          subscriptionStatus: 'PENDING_APPROVAL',
          subscriptionUtr: input.utrNumber,
          subscriptionMethod: 'MANUAL_UPI',
        }
      });
    }),

  verifySubscriptionPayment: vendorProcedure
    .input(z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;
      
      // 1. Verify Signature
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Payment verification failed. Invalid signature.' 
        });
      }

      // 2. Update Vendor Status
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30); // 30 days from now

      return ctx.prisma.vendor.update({
        where: { id: ctx.vendor.id },
        data: {
          plan: 'PREMIUM',
          planExpiresAt: expiry,
          isVerified: true,
          razorpaySubscriptionId: razorpay_order_id, // We store the order ID as sub ID for now
          lastPaymentId: razorpay_payment_id,
        },
      });
    }),
});