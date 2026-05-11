// src/lib/payments/manual-upi.ts
import { PaymentInitiateRequest, PaymentInitiateResponse } from './types';

export function initiateManualUpiPayment(req: PaymentInitiateRequest): PaymentInitiateResponse {
  // Use the admin's UPI ID from environment or a default
  const adminUpiId = process.env.ADMIN_UPI_ID || 'deeshware15-2@okicici';
  const amount = req.amount.toFixed(2);
  const shopName = "Deeshora";
  const transactionNote = `Order_${req.orderId.slice(-8).toUpperCase()}`;

  // UPI Deep Link Format: upi://pay?pa=ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
  const upiUrl = `upi://pay?pa=${adminUpiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  
  // Using a public QR API for generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

  return {
    success: true,
    paymentId: `MANUAL_${Date.now()}`,
    qrUrl,
    payload: {
      upiUrl,
      upiId: adminUpiId,
      amount: req.amount
    }
  };
}
