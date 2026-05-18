// src/lib/payments/manual-upi.ts
import { PaymentInitiateRequest, PaymentInitiateResponse } from "./types";

export function initiateManualUpiPayment(
  req: PaymentInitiateRequest,
): PaymentInitiateResponse {
  // Read vendor details from request notes if available to support direct-to-vendor payments
  const vendorUpiId = req.notes?.vendorUpiId;
  const vendorShopName = req.notes?.vendorShopName;

  const targetUpiId = vendorUpiId || process.env.ADMIN_UPI_ID || "deeshware15-2@okicici";
  const shopName = vendorShopName || "Deeshora";
  const amount = req.amount.toFixed(2);
  const transactionNote = `Order_${req.orderId.slice(-8).toUpperCase()}`;

  // UPI Deep Link Format: upi://pay?pa=ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
  const upiUrl = `upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  // Using a public QR API for generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

  return {
    success: true,
    paymentId: `MANUAL_${Date.now()}`,
    qrUrl,
    payload: {
      upiUrl,
      upiId: targetUpiId,
      amount: req.amount,
    },
  };
}
