// src/app/(customer)/orders/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrderProgressBar, OrderStatusBadge } from '@/components/customer/OrderStatus';
import Image from 'next/image';
import { Wifi, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OrderStatus } from '@prisma/client';


export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;


  const { data: order, isLoading, error } = trpc.order.byId.useQuery({ id: orderId });
  const { updates, currentStatus: liveStatus, isConnected } = useOrderTracking(orderId);
  
  const [displayStatus, setDisplayStatus] = useState<OrderStatus | null>(null);


  useEffect(() => {
    if (liveStatus) {
      setDisplayStatus(liveStatus);
    } else if (order) {
      setDisplayStatus(order.status);
    }
  }, [liveStatus, order]);


  if (isLoading) return <div className="container mx-auto px-4 py-12 text-center animate-pulse">Tracking your order...</div>;
  if (error) return <div className="container mx-auto px-4 py-12 text-center text-red-500 font-bold">Lost connection: {error.message}</div>;
  if (!order) return <div className="container mx-auto px-4 py-12 text-center">We couldn't find that order.</div>;


  const allTimelineEvents = [
    ...updates.map(u => ({ ...u, createdAt: u.timestamp })),
    ...order.timeline
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full mb-3 inline-block">Order in progress</span>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter">Order #{order.id.slice(-8)}</h1>
          <p className="text-gray-500 font-medium">Coming to you from <span className="text-gray-950 font-bold">{order.vendor.shopName}</span></p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isConnected ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-400'} transition-all`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-ping' : 'bg-gray-300'}`}></div>
          <span className="text-sm font-black uppercase tracking-widest">{isConnected ? 'Live updates' : 'Offline'}</span>
        </div>
      </div>


      <div className="card p-10 bg-white border border-gray-100 shadow-2xl shadow-gray-200/40 mb-10 rounded-[2rem]">
        {displayStatus && <OrderProgressBar currentStatus={displayStatus} />}
      </div>


      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="card p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/20 rounded-[2rem]">
            <h2 className="text-xl font-black text-gray-950 uppercase tracking-tight mb-8">Journey Timeline</h2>
            <div className="space-y-10">
              {allTimelineEvents.map((event, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full ring-8 ring-orange-50 shadow-lg shadow-orange-500/20"></div>
                    {index < allTimelineEvents.length - 1 && <div className="w-1 flex-grow bg-gray-50 mt-2 rounded-full"></div>}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <OrderStatusBadge status={event.status} />
                      <span className="text-xs font-bold text-gray-300">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-800 font-bold text-lg">{event.message}</p>
                    <p className="text-sm text-gray-400 font-medium">{new Date(event.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        <div className="lg:col-span-1 space-y-8">
          <div className="card p-8 bg-gray-950 text-white rounded-[2rem] shadow-xl shadow-gray-950/20">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Basket Summary</h3>
            <div className="space-y-5">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-900 flex-shrink-0">
                    <Image src={item.image || ''} alt={item.name} fill className="object-cover opacity-80" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-black text-sm uppercase tracking-tight">{item.name}</p>
                    <p className="text-gray-500 text-xs font-bold">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-black text-orange-500">₹{item.total.toFixed(0)}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-900">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Final Amount</span>
                <span className="text-3xl font-black text-white italic">₹{order.total.toFixed(0)}</span>
              </div>
            </div>
          </div>


          <div className="card p-8 bg-white border border-gray-100 rounded-[2rem] shadow-lg shadow-gray-200/20">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Drop-off At</h3>
            <p className="text-gray-950 font-black leading-relaxed">{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
          </div>


          <div className="card p-8 bg-orange-500 text-white rounded-[2rem] shadow-xl shadow-orange-500/40 group cursor-pointer hover:bg-orange-600 transition-colors">
            <h3 className="text-xs font-black text-orange-200 uppercase tracking-widest mb-2 text-center">Trouble with order?</h3>
            <p className="text-sm font-bold mb-6 text-center opacity-90">Reach out to the store manager directly.</p>
            <a href={`tel:${order.vendor.phone}`} className="flex items-center justify-center gap-3 bg-white text-orange-500 h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg group-hover:scale-[1.02] transition-transform">
              <Phone size={18} fill="currentColor" /> Call Store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}