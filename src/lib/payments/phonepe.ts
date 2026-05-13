// src/lib/payments/phonepe.ts
import crypto from "crypto";
import { PaymentInitiateRequest, PaymentInitiateResponse } from "./types";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "";
const SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const API_URL =
  process.env.PHONEPE_API_URL ||
  "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

export async function initiatePhonePePayment(
  req: PaymentInitiateRequest,
): Promise<PaymentInitiateResponse> {
  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: `T${Date.now()}${req.orderId.slice(-6)}`,
    merchantUserId: req.customerEmail.replace(/[^a-zA-Z0-9]/g, "_"),
    amount: Math.round(req.amount * 100), // convert to paise
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/callback?orderId=${req.orderId}`,
    redirectMode: "POST",
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/phonepe/webhook`,
    mobileNumber: req.customerPhone,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const checksum =
    crypto
      .createHash("sha256")
      .update(base64Payload + "/pg/v1/pay" + SALT_KEY)
      .digest("hex") +
    "###" +
    SALT_INDEX;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        paymentId: data.data.merchantTransactionId,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      };
    } else {
      return {
        success: false,
        paymentId: "",
        message: data.message || "PhonePe initiation failed",
      };
    }
  } catch (error) {
    console.error("[PhonePe] API Error:", error);
    return {
      success: false,
      paymentId: "",
      message: "Failed to connect to PhonePe",
    };
  }
}
