// src/hooks/useOrderTracking.ts
import { useEffect, useRef, useState } from 'react';
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


// ─── Sound helper ─────────────────────────────────────────────────────────────
// Plays a short, pleasant double-ding using the Web Audio API (no file needed)
function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Pleasant double-ding: C5 then E5
    playTone(523, 0, 0.35);
    playTone(659, 0.2, 0.35);
  } catch {
    // Silently ignore if AudioContext is blocked
  }
}


export const useVendorNotifications = (vendorId: string | undefined, onNewOrder: (data: any) => void) => {
  // Use a ref for onNewOrder to avoid re-subscribing on every render
  const onNewOrderRef = useRef(onNewOrder);
  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);

  useEffect(() => {
    if (!vendorId) return;


    const pusherClient = getPusherClient();
    const channelName = `private-vendor-${vendorId}`;
    const channel = pusherClient.subscribe(channelName);


    const handleNewOrder = (data: { orderId: string; customerName: string }) => {
      // Play the audio alert
      playNewOrderSound();
      onNewOrderRef.current(data);
    };


    channel.bind('new-order', handleNewOrder);


    return () => {
      channel.unbind('new-order', handleNewOrder);
      pusherClient.unsubscribe(channelName);
    };
  }, [vendorId]);
};