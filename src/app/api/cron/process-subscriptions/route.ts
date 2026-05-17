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
          const total = sub.product.price * sub.quantity;
          const isWalletPaid = sub.user.walletBalance >= total;

          // 1. Create the Order
          const newOrder = await tx.order.create({
            data: {
              userId: sub.userId,
              addressId: sub.addressId || "", // Fallback or throw error if missing
              status: isWalletPaid ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
              paymentStatus: isWalletPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
              paymentMethod: isWalletPaid ? PaymentMethod.WALLET : PaymentMethod.COD,
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
                  status: isWalletPaid ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
                  message: isWalletPaid
                    ? "Order created automatically via subscription (Paid via Wallet)"
                    : "Order created automatically via subscription as Cash on Delivery (Insufficient Wallet Balance)",
                },
              },
            },
          });

          // 2. Process payments/notifications based on payment method
          if (isWalletPaid) {
            // Deduct from wallet
            await tx.user.update({
              where: { id: sub.userId },
              data: { walletBalance: { decrement: total } },
            });

            // Log wallet transaction
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
          } else {
            // Create user notification for low wallet balance
            await tx.notification.create({
              data: {
                userId: sub.userId,
                title: "Low Wallet Balance - Subscription Fallback",
                message: `Your subscription order for ${sub.product.name} was successfully created, but set as Cash on Delivery (COD) due to insufficient wallet balance (₹${sub.user.walletBalance.toFixed(2)} / ₹${total.toFixed(2)} required). Please top up your wallet for automatic payments.`,
                type: "SYSTEM",
                link: `/orders/${newOrder.id}`,
              },
            });
          }

          // 3. Calculate next order date
          const nextDate = new Date(sub.nextOrder);
          if (sub.frequency === "DAILY")
            nextDate.setDate(nextDate.getDate() + 1);
          else if (sub.frequency === "WEEKLY")
            nextDate.setDate(nextDate.getDate() + 7);
          else if (sub.frequency === "MONTHLY")
            nextDate.setMonth(nextDate.getMonth() + 1);

          // 4. Update subscription
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
