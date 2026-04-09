// src/app/(admin)/admin/orders/page.tsx
"use client";


import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { OrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/customer/OrderStatus";
import { Loader2 } from "lucide-react";


const statusTabs: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];


export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const queryInput = activeTab === 'ALL' ? {} : { status: activeTab as any };
  const { data, isLoading } = trpc.admin.orders.useQuery(queryInput);


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Platform Orders</h1>
      <div className="card">
        <div className="border-b">
          <div className="flex space-x-4 px-4 -mb-px overflow-x-auto">
            {statusTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.orders.map(order => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.id.slice(-8)}</td>
                  <td className="px-4 py-3">{order.user.name}</td>
                  <td className="px-4 py-3">{order.vendor.shopName}</td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold">₹{order.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}