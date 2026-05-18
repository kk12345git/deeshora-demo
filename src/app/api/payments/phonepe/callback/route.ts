// src/app/api/payments/phonepe/callback/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  return await handleCallback(req);
}

export async function GET(req: Request) {
  return await handleCallback(req);
}

async function handleCallback(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");

  try {
    let code: string | null = null;
    let transactionId: string | null = null;

    if (req.method === "POST") {
      try {
        const formData = await req.formData();
        code = formData.get("code")?.toString() || null;
        transactionId = formData.get("transactionId")?.toString() || null;
      } catch (err) {
        console.warn("[PhonePe Callback] Failed to parse formData, falling back to searchParams:", err);
      }
    }

    // Fallback or GET query parameter parsing
    if (!code) code = url.searchParams.get("code");
    if (!transactionId) transactionId = url.searchParams.get("transactionId");

    console.log("[PhonePe Callback]", { orderId, code, transactionId });

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (order) {
        // If the transaction status is successful, redirect customer directly to the timeline
        if (code === "PAYMENT_SUCCESS") {
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?success=true`,
            303,
          );
        } else {
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?error=payment_failed`,
            303,
          );
        }
      }
    }

    // Ultimate fallback if no order id could be resolved
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?payment=${code || "ERROR"}`,
      303,
    );
  } catch (error) {
    console.error("[PhonePe Callback Error]", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId || ""}?error=exception`,
      303,
    );
  }
}
