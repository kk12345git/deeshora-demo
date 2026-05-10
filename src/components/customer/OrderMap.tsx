'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Store, Home, Bike, MapPin } from 'lucide-react';

const DeliveryMap = dynamic(() => import('@/components/delivery/DeliveryMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-[2rem] flex items-center justify-center text-gray-400 font-bold">Loading Live Map...</div>
});

interface OrderMapProps {
  status: string;
  orderId: string;
}

export default function OrderMap({ status, orderId }: OrderMapProps) {
  // For the demo, we generate mock coordinates based on the order ID
  // In a real app, these would come from the order data
  const pickup: [number, number] = [13.16, 80.30];
  const drop: [number, number] = [13.17, 80.31];
  const [driverPos, setDriverPos] = useState<[number, number] | undefined>(undefined);

  useEffect(() => {
    if (status === 'OUT_FOR_DELIVERY') {
      // Simulate driver moving from pickup to drop
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.01;
        if (progress > 1) progress = 1;
        
        const lat = pickup[0] + (drop[0] - pickup[0]) * progress;
        const lng = pickup[1] + (drop[1] - pickup[1]) * progress;
        setDriverPos([lat, lng]);

        if (progress >= 1) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="relative">
      <DeliveryMap 
        pickup={pickup}
        drop={drop}
        driver={status === 'OUT_FOR_DELIVERY' ? driverPos : undefined}
      />
      
      {/* Overlay Status Info */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'OUT_FOR_DELIVERY' ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
            {status === 'OUT_FOR_DELIVERY' ? 'Driver is on the way' : 'Order at Shop'}
          </span>
        </div>
      </div>
    </div>
  );
}
