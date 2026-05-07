// src/app/api/payments/phonepe/callback/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const code = formData.get('code');
    const transactionId = formData.get('transactionId')?.toString();
    
    console.log('[PhonePe Callback]', { code, transactionId });

    if (code === 'PAYMENT_SUCCESS' && transactionId) {
      // Immediate update if possible (webhook is safer but this provides instant feedback)
      const vendor = await prisma.vendor.findFirst({
        where: { lastPaymentId: transactionId }
      });

      if (vendor && vendor.subscriptionStatus !== 'ACTIVE') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await prisma.vendor.update({
          where: { id: vendor.id },
          data: {
            plan: 'PREMIUM',
            subscriptionStatus: 'ACTIVE',
            planExpiresAt: expiryDate,
            subscriptionPaidAt: new Date(),
          }
        });
      }
    }

    // Redirect to vendor dashboard with status
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard?payment=${code}`, 303);
  } catch (error) {
    console.error('[PhonePe Callback Error]', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard?payment=ERROR`, 303);
  }
}
