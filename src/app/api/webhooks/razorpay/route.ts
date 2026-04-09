// src/app/api/webhooks/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import prisma from '@/lib/prisma';


export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature') as string;


  const isValid = verifyWebhookSignature(body, signature);


  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }


  const event = JSON.parse(body);
  const eventType = event.event;
  const payload = event.payload;


  try {
    if (eventType === 'payment.captured') {
      const razorpayOrderId = payload.payment.entity.order_id;
      await prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentStatus: 'PAID' },
      });
    }


    if (eventType === 'payment.failed') {
      const razorpayOrderId = payload.payment.entity.order_id;
      await prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
      });
    }
  } catch (error) {
    console.error(`Error handling Razorpay webhook event ${eventType}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }


  return NextResponse.json({ status: 'ok' });
}