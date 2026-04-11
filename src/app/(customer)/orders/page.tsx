'use client';
// src/app/(customer)/orders/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import Image from 'next/image';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import {
  Package, ArrowRight, ShoppingBag, Loader2,
  Clock, CheckCircle, IndianRupee, Store,
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';

const STATUS_TABS: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'from-amber-500/10 to-amber-500/5 border-amber-200',
  CONFIRMED: 'from-blue-500/10 to-blue-500/5 border-blue-200',
  PREPARING: 'from-purple-500/10 to-purple-500/5 border-purple-200',
  READY: 'from-indigo-500/10 to-indigo-500/5 border-indigo-200',
  OUT_FOR_DELIVERY: 'from-orange-500/10 to-orange-500/5 border-orange-200',
  DELIVERED: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200',
  CANCELLED: 'from-red-500/10 to-red-500/5 border-red-200',
  REFUNDED: 'from-gray-500/10 to-gray-500/5 border-gray-200',
};

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-400',
  CONFIRMED: 'bg-blue-400',
  PREPARING: 'bg-purple-400',
  READY: 'bg-indigo-400',
  OUT_FOR_DELIVERY: 'bg-orange-400 animate-pulse',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-400',
  REFUNDED: 'bg-gray-400',
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');

  const { data, isLoading } = trpc.order.myOrders.useQuery({ limit: 50 });
  const allOrders = data?.orders ?? [];

  const filtered = activeTab === 'ALL'
    ? allOrders
    : allOrders.filter(o => o.status === activeTab);

  const activeCount = allOrders.filter(o =>
    (['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as string[]).includes(o.status as string)
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Orders</h1>
          {activeCount > 0 && (
            <span className="flex items-center gap-2 text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              {activeCount} active
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">Track and manage all your Deeshora orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 text-xs font-black px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-orange-200 hover:text-orange-500'
            }`}
          >
            {tab.label}
            {tab.key !== 'ALL' && (
              <span className={`ml-1.5 text-[10px] ${activeTab === tab.key ? 'text-orange-100' : 'text-gray-300'}`}>
                {allOrders.filter(o => o.status === tab.key).length || ''}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-gray-400 font-medium text-sm">Loading your orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5">
            <ShoppingBag size={36} className="text-gray-300" />
          </div>
          <h3 className="font-black text-gray-700 text-lg">
            {activeTab === 'ALL' ? 'No orders yet!' : `No ${activeTab.toLowerCase().replace(/_/g, ' ')} orders`}
          </h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs">
            {activeTab === 'ALL'
              ? "When you place orders from local shops, they'll show up here."
              : 'Try a different status filter above.'}
          </p>
          {activeTab === 'ALL' && (
            <Link href="/" className="btn-primary mt-6">
              Start Shopping <ArrowRight size={16} className="ml-1" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const colorClass = STATUS_COLORS[order.status] ?? 'border-gray-100';
            const dotClass = STATUS_DOT[order.status] ?? 'bg-gray-400';
            const isActive = (['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as string[]).includes(order.status as string);

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className={`group block bg-gradient-to-br ${colorClass} border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm">
                    {order.items[0]?.image ? (
                      <Image
                        src={order.items[0].image}
                        alt="Order item"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-black text-gray-900 text-sm">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      {isActive && (
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} flex-shrink-0`} />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                      <Store size={11} className="text-gray-400" />
                      <span>{(order as any).vendor.shopName}</span>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 font-black text-gray-900">
                          <IndianRupee size={14} />
                          <span>{(order as any).total.toFixed(2)}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400">
                          {(order as any).items?.length ?? 1} item{((order as any).items?.length ?? 1) > 1 ? 's' : ''}
                        </span>
                        <ArrowRight
                          size={16}
                          className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivered footer */}
                {order.status === 'DELIVERED' && (
                  <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-600 font-bold">
                    <CheckCircle size={13} />
                    Delivered successfully — tap to view invoice
                  </div>
                )}
                {isActive && (
                  <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center gap-2 text-xs text-orange-600 font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                    Live tracking available — tap to view
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}