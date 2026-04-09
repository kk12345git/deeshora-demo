// src/lib/pusher.ts
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';


export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});


let pusherClientInstance: PusherClient | null = null;


export const getPusherClient = () => {
  if (!pusherClientInstance) {
    // Enable pusher logging - don't include this in production
    // PusherClient.logToConsole = true;
    
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      authTransport: 'ajax',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }
  return pusherClientInstance;
};


// Channel & Event constants
export const CHANNELS = {
  ORDER: (orderId: string) => `private-order-${orderId}`,
  VENDOR: (vendorId: string) => `private-vendor-${vendorId}`,
  ADMIN: 'private-admin',
};


export const EVENTS = {
  ORDER_STATUS_UPDATED: 'order-status-updated',
  NEW_ORDER: 'new-order',
  VENDOR_APPROVED: 'vendor-approved',
};