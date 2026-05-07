// src/app/api/automate/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Simple security check using an API key from env
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (key !== process.env.AUTOMATION_KEY && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    subscriptionsProcessed: 0,
    notificationsSent: 0,
    errors: [] as string[],
  };

  try {
    // 1. Process Expired Subscriptions
    const now = new Date();
    const expiredVendors = await prisma.vendor.findMany({
      where: {
        plan: 'PREMIUM',
        planExpiresAt: { lt: now },
        subscriptionStatus: 'ACTIVE',
      },
    });

    for (const vendor of expiredVendors) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          subscriptionStatus: 'EXPIRED',
        },
      });

      await logActivity({
        type: 'SYSTEM',
        action: 'SUBSCRIPTION',
        entityId: vendor.id,
        entityType: 'Vendor',
        message: `Subscription for ${vendor.shopName} has expired automatically.`,
        metadata: { expiredAt: vendor.planExpiresAt },
      });

      results.subscriptionsProcessed++;
    }

    // 2. Low Stock Notifications
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: prisma.product.fields.lowStockThreshold },
      },
      include: { vendor: { select: { userId: true, shopName: true } } },
    });

    for (const product of lowStockProducts) {
      // Check if we already notified recently (last 24h) to avoid spam
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: product.vendor.userId,
          type: 'LOW_STOCK',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          message: { contains: product.name },
        },
      });

      if (!recentNotification) {
        await prisma.notification.create({
          data: {
            userId: product.vendor.userId,
            title: 'Low Stock Alert',
            message: `Your product "${product.name}" is low on stock (${product.stock} left).`,
            type: 'LOW_STOCK',
            link: `/vendor/products`,
          },
        });
        results.notificationsSent++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('[Automation] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
