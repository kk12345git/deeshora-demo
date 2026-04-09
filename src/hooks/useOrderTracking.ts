// src/hooks/useOrderTracking.ts
import { useEffect, useState } from 'react';
import { getPusherClient } from '@/lib/pusher';
import { OrderStatus } from '@prisma/client';
import toast from 'react-hot-toast';


interface OrderUpdate {
  status: OrderStatus;
  message: string;
  timestamp: Date;
}


export const useOrderTracking = (orderId: string) => {
  const [updates, setUpdates] = useState<OrderUpdate[]>([]);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);


  useEffect(() => {
    if (!orderId) return;


    const pusherClient = getPusherClient();
    const channelName = `private-order-${orderId}`;
    const channel = pusherClient.subscribe(channelName);


    const handleConnection = () => setIsConnected(true);
    const handleDisconnection = () => setIsConnected(false);


    const handleUpdate = (data: { status: OrderStatus; message: string }) => {
      const newUpdate: OrderUpdate = { ...data, timestamp: new Date() };
      setCurrentStatus(data.status);
      setUpdates((prev) => [newUpdate, ...prev]);
      toast.success(`Order Update: ${data.message}`);
    };


    channel.bind('pusher:subscription_succeeded', handleConnection);
    channel.bind('pusher:subscription_error', handleDisconnection);
    channel.bind('order-status-updated', handleUpdate);


    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [orderId]);


  return { updates, currentStatus, isConnected };
};


export const useVendorNotifications = (vendorId: string | undefined, onNewOrder: (data: any) => void) => {
  useEffect(() => {
    if (!vendorId) return;


    const pusherClient = getPusherClient();
    const channelName = `private-vendor-${vendorId}`;
    const channel = pusherClient.subscribe(channelName);


    const handleNewOrder = (data: { orderId: string; customerName: string }) => {
      toast.success(`New order #${data.orderId.slice(-6)} from ${data.customerName}!`);
      onNewOrder(data);
    };


    channel.bind('new-order', handleNewOrder);


    return () => {
      channel.unbind('new-order', handleNewOrder);
      pusherClient.unsubscribe(channelName);
    };
  }, [vendorId, onNewOrder]);
};