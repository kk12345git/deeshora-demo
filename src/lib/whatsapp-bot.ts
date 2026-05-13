/**
 * Daily1Mart WhatsApp Bot Library (Chennai Metro Style)
 * Handles generation of interactive list messages and buttons
 */

interface WhatsAppConfig {
  accessToken: string;
  phoneId: string;
}

export class Daily1MartBot {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  private async sendRequest(payload: any) {
    const url = `https://graph.facebook.com/v19.0/${this.config.phoneId}/messages`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...payload,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      return { error };
    }
  }

  /**
   * Send Welcome Menu with Reply Buttons (English & Tamil)
   */
  async sendWelcome(to: string) {
    return this.sendRequest({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: 'Daily1Mart - Your Local Marketplace' },
        body: { text: 'Welcome! How can we help you today?\n\nவணக்கம்! இன்று நாங்கள் உங்களுக்கு எவ்வாறு உதவ முடியும்?' },
        footer: { text: 'Select an option below' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_browse', title: '🛍️ Browse Menu' } },
            { type: 'reply', reply: { id: 'btn_track', title: '🚚 Track Order' } },
            { type: 'reply', reply: { id: 'btn_support', title: '💬 Support' } },
          ],
        },
      },
    });
  }

  /**
   * Send Category List Message (Interactive List)
   */
  async sendCategoryList(to: string, categories: { id: string; name: string }[]) {
    const rows = categories.map(cat => ({
      id: `cat_${cat.id}`,
      title: cat.name,
      description: `View items in ${cat.name}`,
    }));

    return this.sendRequest({
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'Browse Categories' },
        body: { text: 'Please select a category to view available products.' },
        footer: { text: 'Daily1Mart Shopping' },
        action: {
          button: 'Select Category',
          sections: [
            {
              title: 'Popular Categories',
              rows: rows.slice(0, 10),
            },
          ],
        },
      },
    });
  }

  /**
   * Send Order Status with Map Link
   */
  async sendOrderStatus(to: string, order: { id: string; status: string; total: number }) {
    const trackingUrl = `https://Daily1Mart.in/orders/${order.id}`;
    return this.sendRequest({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: `📦 *Order #${order.id.slice(-8).toUpperCase()}*\n\nStatus: ${order.status}\nTotal: ₹${order.total}\n\nYou can track your delivery live on our map.` },
        action: {
          buttons: [
            { type: 'reply', reply: { id: `view_${order.id}`, title: '📍 Live Tracking' } },
            { type: 'reply', reply: { id: 'btn_menu', title: '🏠 Back to Menu' } },
          ],
        },
      },
    });
  }

  /**
   * Send Delivery Verification QR (Metro Style)
   */
  async sendDeliveryQR(to: string, orderId: string) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=VERIFY_DELIVERY_${orderId}`;
    
    return this.sendRequest({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { 
          type: 'image', 
          image: { link: qrUrl } 
        },
        body: { text: `🎟️ *Your Delivery Pass*\n\nOrder: #${orderId.slice(-8).toUpperCase()}\n\nPlease show this QR code to the delivery partner when they arrive to confirm your delivery.` },
        footer: { text: 'Daily1Mart Secure Delivery' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: `view_map_${orderId}`, title: '📍 Track Driver' } },
          ],
        },
      },
    });
  }
}
