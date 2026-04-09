// src/app/(vendor)/vendor/orders/page.tsx
"use client";


import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { OrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/customer/OrderStatus";
import { ChevronDown, Phone, MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast";


const statusTabs: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];


export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);


  const queryInput = activeTab === 'ALL' ? {} : { status: activeTab };
  const { data, isLoading, refetch } = trpc.order.vendorOrders.useQuery(queryInput);
  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });


  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status });
  };


  const ActionButtons = ({ order }: { order: any }) => {
    switch (order.status) {
      case 'PENDING':
        return (
          <>
            <button onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')} className="btn-primary bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5">Accept Order</button>
            <button onClick={() => handleStatusUpdate(order.id, 'CANCELLED')} className="btn-secondary bg-red-500 text-white hover:bg-red-600 text-xs px-3 py-1.5">Reject</button>
          </>
        );
      case 'CONFIRMED':
        return <button onClick={() => handleStatusUpdate(order.id, 'PREPARING')} className="btn-primary bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1.5">Start Preparing</button>;
      case 'PREPARING':
        return <button onClick={() => handleStatusUpdate(order.id, 'READY')} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-xs px-3 py-1.5">Mark Ready</button>;
      case 'READY':
        return <button onClick={() => handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY')} className="btn-primary bg-orange-600 hover:bg-orange-700 text-xs px-3 py-1.5">Out for Delivery</button>;
      case 'OUT_FOR_DELIVERY':
        return <button onClick={() => handleStatusUpdate(order.id, 'DELIVERED')} className="btn-primary bg-green-600 hover:bg-green-700 text-xs px-3 py-1.5">Mark Delivered</button>;
      default:
        return null;
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      <div className="card">
        <div className="border-b">
          <div className="flex space-x-4 px-4 -mb-px overflow-x-auto">
            {statusTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
          <div className="divide-y">
            {data?.orders.map(order => (
              <div key={order.id}>
                <div onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="grid grid-cols-6 gap-4 p-4 items-center cursor-pointer hover:bg-gray-50">
                  <div className="font-mono text-xs text-gray-500">#{order.id.slice(-8)}</div>
                  <div>{order.user.name}</div>
                  <div className="text-sm text-gray-600">{order.items.length} items</div>
                  <div className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</div>
                  <div className="font-semibold">₹{order.total.toFixed(2)}</div>
                  <div className="flex justify-between items-center">
                    <OrderStatusBadge status={order.status} />
                    <ChevronDown size={18} className={`transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expandedOrderId === order.id && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Items</h4>
                        <ul className="text-xs space-y-1">
                          {order.items.map(item => <li key={item.id}>{item.quantity} x {item.name}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Customer Info</h4>
                        <p className="text-xs flex items-center gap-2"><MapPin size={12} /> {order.address.line1}, {order.address.city}</p>
                        <a href={`tel:${order.user.phone}`} className="text-xs flex items-center gap-2 text-blue-600 hover:underline"><Phone size={12} /> {order.user.phone}</a>
                        {order.notes && <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-xs">Note: {order.notes}</div>}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Actions</h4>
                        <div className="flex gap-2">
                          <ActionButtons order={order} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}