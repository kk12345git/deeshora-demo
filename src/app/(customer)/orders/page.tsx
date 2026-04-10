// src/app/(customer)/orders/page.tsx
import { api } from '@/lib/trpc-server';
import Link from 'next/link';
import Image from 'next/image';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import { Package } from 'lucide-react';


export default async function OrdersPage() {
  const { orders } = await api.order.myOrders({});


  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package size={64} className="mx-auto text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold">No Orders Yet</h1>
        <p className="mt-2 text-gray-500">You haven't placed any orders. Let's change that!</p>
        <Link href="/" className="btn-primary mt-6">
          Start Shopping
        </Link>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map(order => (
          <Link key={order.id} href={`/orders/${order.id}`} className="card p-5 block hover:shadow-lg transition-shadow">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-shrink-0">
                {order.items[0]?.image && (
                  <Image src={order.items[0].image} alt="Order item" width={64} height={64} className="rounded-lg object-cover" />
                )}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</p>
                <p className="text-sm text-gray-500">From: {order.vendor.shopName}</p>
                <p className="text-xs text-gray-400">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">₹{order.total.toFixed(2)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}