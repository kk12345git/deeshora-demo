// src/lib/payments/index.ts
import { PaymentInitiateRequest, PaymentInitiateResponse, PaymentProvider } from './types';
import { initiatePhonePePayment } from './phonepe';
import { initiateManualUpiPayment } from './manual-upi';

export * from './types';

export async function initiatePayment(
  provider: PaymentProvider, 
  req: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  switch (provider) {
    case 'PHONEPE':
      return await initiatePhonePePayment(req);
    case 'MANUAL_UPI':
      return initiateManualUpiPayment(req);
    case 'RAZORPAY':
      // Fallback or legacy support
      return { success: false, paymentId: '', message: 'Razorpay is temporarily disabled' };
    default:
      return { success: false, paymentId: '', message: 'Invalid payment provider' };
  }
}
