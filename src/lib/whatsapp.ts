// src/lib/whatsapp.ts

/**
 * Generates a WhatsApp wa.me link with pre-filled message
 * @param phone Phone number with country code (e.g., 918939318865)
 * @param message Message text
 */
export function getWhatsAppUrl(phone: string, message: string) {
  // Clean phone number: remove spaces, dashes, etc.
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getProductShareUrl(phone: string, productName: string, productSlug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deeshora.com';
  const productUrl = `${appUrl}/product/${productSlug}`;
  const message = `Hi! I'm interested in this product: *${productName}*\n\n${productUrl}\n\nCan you provide more details?`;
  return getWhatsAppUrl(phone, message);
}

/**
 * Generates a UPI Payment deep link
 */
export function getUPILink(vpa: string, name: string, amount: number, orderId: string) {
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=Order_${orderId.slice(-8).toUpperCase()}`;
}

export const WHATSAPP_TEMPLATES = {
  ENGLISH: {
    INVOICE_SHARE: (orderId: string, shopName: string, invoiceUrl: string) => 
      `Hello! Here is your tax invoice for Order #${orderId.slice(-8).toUpperCase()} from ${shopName}. You can view and download it here: ${invoiceUrl}`,
      
    ORDER_UPDATE: (orderId: string, status: string, shopName: string) => 
      `Hello! Update on your Order #${orderId.slice(-8).toUpperCase()} from ${shopName}: The status is now "${status.replace(/_/g, ' ')}".`,

    ORDER_DELAYED: (orderId: string, shopName: string, reason?: string) =>
      `Hi! We apologize for the delay with your order #${orderId.slice(-8).toUpperCase()} from ${shopName}.${reason ? ` Reason: ${reason}` : ''} We are working to get it to you as soon as possible! 🙏`,

    LOCATION_REQUEST: (orderId: string, shopName: string) =>
      `Hello! This is ${shopName}. We are preparing your order #${orderId.slice(-8).toUpperCase()}. Could you please share your live location for faster delivery?`,

    DELIVERY_ARRIVAL: (orderId: string, shopName: string) =>
      `Hi! Your delivery agent for order #${orderId.slice(-8).toUpperCase()} from ${shopName} has arrived at your location! 🛵`,

    PAYMENT_REQUEST: (orderId: string, shopName: string, amount: number, upiLink: string) =>
      `Hi! Requesting payment for Order #${orderId.slice(-8).toUpperCase()} from ${shopName}. Amount: ₹${amount.toFixed(2)}\n\nClick here to pay via any UPI app: ${upiLink}\n\nThank you! 🙏`,

    GENERAL_SUPPORT: () =>
      `Hello Deeshora Support! I need help with my account/order.`,

    GENERAL_INQUIRY: (shopName: string) =>
      `Hello! I'm interested in shopping from ${shopName}. Could you please help me with some details?`,
  },
  
  TAMIL: {
    INVOICE_SHARE: (orderId: string, shopName: string, invoiceUrl: string) => 
      `வணக்கம்! ${shopName}-ல் நீங்கள் செய்த ஆர்டர் #${orderId.slice(-8).toUpperCase()}-க்கான ரசீது இதோ: ${invoiceUrl}`,
      
    ORDER_UPDATE: (orderId: string, status: string, shopName: string) => 
      `வணக்கம்! ${shopName}-ல் உங்கள் ஆர்டர் #${orderId.slice(-8).toUpperCase()} இப்போது "${status.replace(/_/g, ' ')}" நிலையில் உள்ளது.`,

    ORDER_DELAYED: (orderId: string, shopName: string, reason?: string) =>
      `வணக்கம்! உங்கள் ஆர்டர் #${orderId.slice(-8).toUpperCase()} டெலிவரி செய்வதில் சிறிது தாமதம் ஏற்பட்டுள்ளது. வருந்துகிறோம்! 🙏`,

    LOCATION_REQUEST: (orderId: string, shopName: string) =>
      `வணக்கம்! இது ${shopName}. உங்கள் ஆர்டர் #${orderId.slice(-8).toUpperCase()} தயாராகிறது. தயவுசெய்து உங்கள் இருப்பிடத்தை (Live Location) பகிரவும். 📍`,

    DELIVERY_ARRIVAL: (orderId: string, shopName: string) =>
      `வணக்கம்! ${shopName}-ல் உங்கள் ஆர்டர் #${orderId.slice(-8).toUpperCase()} இப்போது உங்கள் வீட்டு வாசலில் உள்ளது! 🛵`,

    PAYMENT_REQUEST: (orderId: string, shopName: string, amount: number, upiLink: string) =>
      `வணக்கம்! உங்கள் ஆர்டர் #${orderId.slice(-8).toUpperCase()}-க்கான கட்டணம் ₹${amount.toFixed(2)}. இந்த லிங்க் மூலம் பணம் செலுத்தலாம்: ${upiLink}\n\nநன்றி! 🙏`,
      
    GENERAL_SUPPORT: () =>
      `வணக்கம் Deeshora உதவி மையம்! எனக்கு ஒரு உதவி தேவை.`,
  }
};
