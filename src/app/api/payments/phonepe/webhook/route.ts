// src/app/api/payments/phonepe/webhook/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { response } = body;

    // 1. Verify Checksum
    const checksum = req.headers.get('X-VERIFY');
    const expectedChecksum = crypto
      .createHash('sha256')
      .update(response + SALT_KEY)
      .digest('hex') + '###' + SALT_INDEX;

    if (checksum !== expectedChecksum) {
      return NextResponse.json({ success: false, message: 'Invalid checksum' }, { status: 400 });
    }

    // 2. Decode Payload
    const payload = JSON.parse(Buffer.from(response, 'base64').toString());
    const { success, code, data } = payload;

    if (success && code === 'PAYMENT_SUCCESS') {
      const transactionId = data.merchantTransactionId;
      console.log(`[PhonePe Webhook] Payment successful for transaction: ${transactionId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PhonePe Webhook Error]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
