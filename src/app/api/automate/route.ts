// src/app/api/automate/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const AUTOMATION_KEY = process.env.AUTOMATION_KEY || process.env.CRON_SECRET;
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  // Always require the key — reject if env var is missing or key doesn't match
  if (!AUTOMATION_KEY || key !== AUTOMATION_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    lowStockNotificationsSent: 0,
    errors: [] as string[],
  };

  try {
    // 1. Get the admin user to notify
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 500 },
      );
    }

    // 2. Process Low Stock Alerts
    const allLowStockCandidates = await prisma.product.findMany({
      where: { isActive: true, stock: { lte: 10 } }, // broad pre-filter
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    });

    const lowStockProducts = allLowStockCandidates.filter(
      (p) => p.stock <= p.lowStockThreshold,
    );

    for (const product of lowStockProducts) {
      // Check if we already notified recently (last 24h) to avoid spam
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: adminUser.id,
          type: "LOW_STOCK",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          message: { contains: product.name },
        },
      });

      if (!recentNotification) {
        await prisma.notification.create({
          data: {
            userId: adminUser.id,
            title: "Low Stock Alert",
            message: `Product "${product.name}" is low on stock (${product.stock} left).`,
            type: "LOW_STOCK",
            link: `/admin/products`,
          },
        });
        results.lowStockNotificationsSent++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error("[Automation] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
