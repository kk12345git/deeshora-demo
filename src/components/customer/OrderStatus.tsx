// src/components/customer/OrderStatus.tsx
import { OrderStatus as OrderStatusEnum } from '@prisma/client';
import { CheckCircle, Circle, Package, CookingPot, Bike, Home, XCircle } from 'lucide-react';


const statusConfig = {
  PENDING: { text: 'Pending', color: 'gray', icon: <Circle size={16} /> },
  CONFIRMED: { text: 'Confirmed', color: 'blue', icon: <CheckCircle size={16} /> },
  PREPARING: { text: 'Preparing', color: 'purple', icon: <CookingPot size={16} /> },
  READY: { text: 'Ready for Delivery', color: 'indigo', icon: <Package size={16} /> },
  OUT_FOR_DELIVERY: { text: 'Out for Delivery', color: 'orange', icon: <Bike size={16} /> },
  DELIVERED: { text: 'Delivered', color: 'green', icon: <Home size={16} /> },
  CANCELLED: { text: 'Cancelled', color: 'red', icon: <XCircle size={16} /> },
  REFUNDED: { text: 'Refunded', color: 'red', icon: <XCircle size={16} /> },
};


const colorClasses = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  orange: 'bg-orange-100 text-orange-800',
  green: 'bg-green-100 text-green-100', // Fixed green text contrast
  red: 'bg-red-100 text-red-00',
};


export function OrderStatusBadge({ status }: { status: OrderStatusEnum }) {
  const config = statusConfig[status];
  return (
    <span className={`badge ${colorClasses[config.color]} gap-1.5`}>
      {config.icon}
      {config.text}
    </span>
  );
}


const progressSteps: OrderStatusEnum[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];


export function OrderProgressBar({ currentStatus }: { currentStatus: OrderStatusEnum }) {
  const currentIndex = progressSteps.indexOf(currentStatus);


  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (progressSteps.length - 1)) * 100}%` }}
        ></div>
        {progressSteps.map((step, index) => (
          <div key={step} className="z-10 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                index <= currentIndex ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {statusConfig[step].icon}
            </div>
            <span className={`mt-2 text-xs text-center ${index <= currentIndex ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {statusConfig[step].text.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}