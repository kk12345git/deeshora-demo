import { Prisma } from "@prisma/client";
import prisma from "./prisma";

export async function creditRedeemPointsForOrder(
  orderId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx || prisma;

  // 1. Fetch order details with items
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    console.warn(`[Points] Order #${orderId} not found`);
    return;
  }

  // 2. Only credit points if the order is PAID
  if (order.paymentStatus !== "PAID") {
    console.log(`[Points] Order #${order.id.slice(-6)} is not paid (${order.paymentStatus})`);
    return;
  }

  // 3. Check if points have already been credited for this order to prevent double-crediting
  const existingTx = await client.pointsTransaction.findFirst({
    where: {
      userId: order.userId,
      reference: orderId,
      type: "EARNED",
    },
  });

  if (existingTx) {
    console.log(`[Points] Points already credited for order #${order.id.slice(-6)}`);
    return;
  }

  // 4. Calculate 1% points for each product purchased
  // "add 1% offer for each products that the customer purchase and after paid it should be added to their account and save as a redeem points"
  let totalPointsEarned = 0;
  for (const item of order.items) {
    const pointsForItem = item.total * 0.01;
    totalPointsEarned += pointsForItem;
  }

  // Round to 2 decimal places to avoid floating point precision issues
  totalPointsEarned = Math.round(totalPointsEarned * 100) / 100;

  if (totalPointsEarned <= 0) {
    console.log(`[Points] Points earned is zero or negative for order #${order.id.slice(-6)}`);
    return;
  }

  console.log(`[Points] Crediting ${totalPointsEarned} points to user ${order.userId} for order #${order.id.slice(-6)}`);

  // 5. Update user's redeemPoints and log the PointsTransaction
  await client.user.update({
    where: { id: order.userId },
    data: {
      redeemPoints: { increment: totalPointsEarned },
    },
  });

  await client.pointsTransaction.create({
    data: {
      userId: order.userId,
      points: totalPointsEarned,
      type: "EARNED",
      description: `Earned 1% points for Order #${order.id.slice(-6)}`,
      reference: orderId,
    },
  });

  // 6. Create a notification for the user
  await client.notification.create({
    data: {
      userId: order.userId,
      title: "Points Earned! 🌟",
      message: `You earned ${totalPointsEarned.toFixed(2)} redeem points from your recent purchase.`,
      type: "SYSTEM",
      link: "/wallet/redeem",
    },
  });
}
