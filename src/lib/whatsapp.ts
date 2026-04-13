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

export const WHATSAPP_TEMPLATES = {
  INVOICE_SHARE: (orderId: string, shopName: string, invoiceUrl: string) => 
    `Hello! Here is your tax invoice for Order #${orderId.slice(-8).toUpperCase()} from ${shopName}. You can view and download it here: ${invoiceUrl}`,
    
  ORDER_UPDATE: (orderId: string, status: string, shopName: string) => 
    `Hello! Update on your Order #${orderId.slice(-8).toUpperCase()} from ${shopName}: The status is now "${status.replace(/_/g, ' ')}".`,

  LOCATION_REQUEST: (orderId: string, shopName: string) =>
    `Hello! This is ${shopName}. We are preparing your order #${orderId.slice(-8).toUpperCase()}. Could you please share your live location for faster delivery?`,
};
