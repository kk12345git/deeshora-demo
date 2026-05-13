// src/lib/pusher.ts
import PusherServer from "pusher";
import PusherClient from "pusher-js";

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

    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
        authTransport: "ajax",
        auth: {
          headers: {
            "Content-Type": "application/json",
          },
        },
      },
    );

    // Debugging: Log connection states
    pusherClientInstance.connection.bind("state_change", (states: any) => {
      console.log(
        "[Pusher] Connection state changed from",
        states.previous,
        "to",
        states.current,
      );
    });

    pusherClientInstance.connection.bind("error", (err: any) => {
      console.error("[Pusher] Connection error:", err);
    });
  }
  return pusherClientInstance;
};

// Channel & Event constants
export const CHANNELS = {
  ORDER: (orderId: string) => `private-order-${orderId}`,
  ADMIN: "private-admin",
};

export const EVENTS = {
  ORDER_STATUS_UPDATED: "order-status-updated",
  NEW_ORDER: "new-order",
  LOW_STOCK_ALERT: "low-stock-alert",
  NEW_PAYMENT_VERIFICATION: "new-payment-verification",
  PAYMENT_VERIFIED: "payment-verified",
  NEW_ACTIVITY: "new-activity",
  STATS_UPDATED: "stats-updated",
};
