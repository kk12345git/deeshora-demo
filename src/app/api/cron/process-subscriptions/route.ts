import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  TransactionType,
  TransactionStatus,
} from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    const subscriptions = await prisma.orderSubscription.findMany({
      where: {
        isActive: true,
        nextOrder: { lte: now },
      },
      include: {
        product: true,
        user: true,
      },
    });

    const results = [];

    for (const sub of subscriptions) {
      try {
        const order = await prisma.$transaction(async (tx) => {
          // 1. Check user wallet balance
          if (sub.user.walletBalance < sub.product.price * sub.quantity) {
            // Option A: Skip and mark as failed?
            // For now, let's just skip this subscription or mark it for intervention.
            // In a real app, you might send a "Wallet low" notification.
            throw new Error(
              `Insufficient wallet balance for user ${sub.userId}`,
            );
          }

          const total = sub.product.price * sub.quantity;

          // 2. Create the Order
          const newOrder = await tx.order.create({
            data: {
              userId: sub.userId,
              addressId: sub.addressId || "", // Fallback or throw error if missing
              status: OrderStatus.CONFIRMED, // Subscriptions are pre-confirmed if paid by wallet
              paymentStatus: PaymentStatus.PAID,
              paymentMethod: PaymentMethod.WALLET,
              subtotal: total,
              total: total,
              items: {
                create: {
                  productId: sub.productId,
                  name: sub.product.name,
                  image: sub.product.images[0],
                  price: sub.product.price,
                  mrp: sub.product.mrp,
                  quantity: sub.quantity,
                  total: total,
                },
              },
              timeline: {
                create: {
                  status: OrderStatus.CONFIRMED,
                  message: "Order created automatically via subscription",
                },
              },
            },
          });

          // 3. Deduct from wallet
          await tx.user.update({
            where: { id: sub.userId },
            data: { walletBalance: { decrement: total } },
          });

          // 4. Log transaction
          await tx.walletTransaction.create({
            data: {
              userId: sub.userId,
              amount: -total,
              type: TransactionType.PAYMENT,
              status: TransactionStatus.COMPLETED,
              description: `Subscription payment for ${sub.product.name}`,
              reference: newOrder.id,
            },
          });

          // 5. Calculate next order date
          const nextDate = new Date(sub.nextOrder);
          if (sub.frequency === "DAILY")
            nextDate.setDate(nextDate.getDate() + 1);
          else if (sub.frequency === "WEEKLY")
            nextDate.setDate(nextDate.getDate() + 7);
          else if (sub.frequency === "MONTHLY")
            nextDate.setMonth(nextDate.getMonth() + 1);

          // 6. Update subscription
          await tx.orderSubscription.update({
            where: { id: sub.id },
            data: { nextOrder: nextDate },
          });

          return newOrder;
        });

        results.push({
          subscriptionId: sub.id,
          orderId: order.id,
          status: "SUCCESS",
        });
      } catch (err: any) {
        results.push({
          subscriptionId: sub.id,
          status: "FAILED",
          error: err.message,
        });
      }
    }

    return NextResponse.json({ processed: subscriptions.length, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
