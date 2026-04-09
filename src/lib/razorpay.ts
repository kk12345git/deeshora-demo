// src/lib/razorpay.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';


export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export const createRazorpayOrder = async (amount: number, receipt: string) => {
  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: receipt,
  };
  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Could not create Razorpay order");
  }
};


export const verifyRazorpaySignature = (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;


  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex');


  return expectedSignature === razorpay_signature;
};


export const verifyWebhookSignature = (body: string, signature: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');


  return expectedSignature === signature;
};