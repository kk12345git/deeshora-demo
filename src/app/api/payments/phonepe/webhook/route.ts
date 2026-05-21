// src/app/api/payments/phonepe/webhook/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { creditRedeemPointsForOrder } from "@/lib/points";

const SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { response } = body;

    // 1. Verify Checksum
    const checksum = req.headers.get("X-VERIFY");
    const expectedChecksum =
      crypto
        .createHash("sha256")
        .update(response + SALT_KEY)
        .digest("hex") +
      "###" +
      SALT_INDEX;

    if (checksum !== expectedChecksum) {
      console.warn("[PhonePe Webhook] Invalid checksum mismatch");
      return NextResponse.json(
        { success: false, message: "Invalid checksum" },
        { status: 400 },
      );
    }

    // 2. Decode Payload
    const payload = JSON.parse(Buffer.from(response, "base64").toString());
    const { success, code, data } = payload;

    if (success && code === "PAYMENT_SUCCESS") {
      const transactionId = data.merchantTransactionId;
      console.log(
        `[PhonePe Webhook] Payment successful for transaction: ${transactionId}`,
      );

      // Find the corresponding order using our stored paymentId mapping
      const order = await prisma.order.findFirst({
        where: { paymentId: transactionId },
      });

      if (order) {
        if (order.paymentStatus !== "PAID") {
          // Idempotent state update to PAID and CONFIRMED
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              timeline: {
                create: {
                  status: "CONFIRMED",
                  message: "Payment successfully verified via PhonePe Webhook.",
                },
              },
            },
          });

          await creditRedeemPointsForOrder(order.id, prisma);

          // Dispatch real-time Pusher updates to immediately refresh the customer screen
          try {
            await pusherServer.trigger(
              CHANNELS.ORDER(order.id),
              EVENTS.PAYMENT_VERIFIED,
              {
                status: "PAID",
                message: "Payment verified successfully.",
              },
            );

            await pusherServer.trigger(
              CHANNELS.ORDER(order.id),
              EVENTS.ORDER_STATUS_UPDATED,
              {
                status: "CONFIRMED",
                message: "Order has been confirmed.",
              },
            );
          } catch (pusherErr) {
            console.error("[PhonePe Webhook] Pusher triggers failed:", pusherErr);
          }
        } else {
          console.log(`[PhonePe Webhook] Order #${order.id} is already marked as PAID`);
        }
      } else {
        console.warn(`[PhonePe Webhook] No order matches transaction: ${transactionId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PhonePe Webhook Error]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
