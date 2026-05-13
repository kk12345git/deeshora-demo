// src/app/api/payments/phonepe/callback/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const code = formData.get("code");
    const transactionId = formData.get("transactionId")?.toString();

    console.log("[PhonePe Callback]", { code, transactionId });

    // Redirect to home with status
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?payment=${code}`,
      303,
    );
  } catch (error) {
    console.error("[PhonePe Callback Error]", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?payment=ERROR`,
      303,
    );
  }
}
