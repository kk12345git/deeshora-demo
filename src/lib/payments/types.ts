// src/lib/payments/types.ts

export type PaymentProvider = 'PHONEPE' | 'RAZORPAY' | 'MANUAL_UPI';

export interface PaymentInitiateRequest {
  orderId: string;
  amount: number; // in Rupees
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  callbackUrl: string;
  notes?: Record<string, string>;
}

export interface PaymentInitiateResponse {
  success: boolean;
  paymentId: string;
  redirectUrl?: string; // For hosted gateways
  payload?: any;       // For SDK based gateways (e.g. Razorpay)
  qrUrl?: string;      // For manual UPI
  message?: string;
}

export interface PaymentVerifyRequest {
  paymentId: string;
  orderId: string;
  providerData?: any; // Checksum, signature, etc.
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: 'PAID' | 'FAILED' | 'PENDING';
  transactionId?: string;
  message?: string;
}
