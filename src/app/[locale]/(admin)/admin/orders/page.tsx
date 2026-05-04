'use client';
// src/app/(admin)/admin/orders/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { OrderStatus } from '@prisma/client';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import {
  Loader2, Search, ShoppingCart, ChevronDown, ChevronRight,
  User, MapPin, Package, IndianRupee, Clock, ChevronLeft,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Status flow for the quick-advance selector
const STATUS_FLOW: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:          'bg-amber-50  border-amber-200  text-amber-700',
  CONFIRMED:        'bg-blue-50   border-blue-200   text-blue-700',
  PREPARING:        'bg-purple-50 border-purple-200 text-purple-700',
  READY:            'bg-indigo-50 border-indigo-200 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-50 border-orange-200 text-orange-700',
  DELIVERED:        'bg-emerald-50 border-emerald-200 text-emerald-700',
  CANCELLED:        'bg-red-50    border-red-200    text-red-700',
  REFUNDED:         'bg-gray-50   border-gray-200   text-gray-500',
};

const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const;
type Tab = typeof TABS[number];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryInput = activeTab === 'ALL' ? {} : { status: activeTab as OrderStatus };
  const { data, isLoading, refetch } = trpc.admin.orders.useQuery(queryInput);

  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: (order) => {
      toast.success(`Order ${order.status.replace('_', ' ')} ✅`);
      setExpandedId(null);
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const orders = (data?.orders ?? []).filter(o =>
    !search ||
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.vendor.shopName.toLowerCase().includes(search.toLowerCase())
  );

  // Count per tab (from all orders before filter)
  const allOrders = data?.orders ?? [];
  const counts: Partial<Record<Tab, number>> = { ALL: allOrders.length };
  allOrders.forEach(o => {
    const key = o.status as Tab;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Operations</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">All Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">{allOrders.length} orders visible</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Order ID, customer, vendor…"
              className="pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 font-medium w-60"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === tab
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.replace('_', ' ')}
            {counts[tab] !== undefined && counts[tab]! > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <ShoppingCart size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400 text-sm">No orders found</p>
          {search && <p className="text-xs text-gray-300 mt-1">Try clearing your search</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {orders.map(order => {
            const isExpanded = expandedId === order.id;
            const statusIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
            const nextStatus = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1
              ? STATUS_FLOW[statusIdx + 1]
              : null;
            const isFinal = order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'REFUNDED';

            return (
              <div key={order.id} className={`transition-colors ${isExpanded ? 'bg-gray-50/60' : ''}`}>
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  {/* Status dot */}
                  <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-emerald-400' :
                    order.status === 'CANCELLED' ? 'bg-red-400' :
                    order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-400 animate-pulse' :
                    'bg-amber-400'
                  }`} />

                  {/* Order ID + items */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-900 text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {order.user.name} · {order.vendor.shopName}
                    </p>
                  </div>

                  {/* Amount + date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="font-black text-gray-900 text-sm">₹{order.total.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>

                  {/* Quick advance button */}
                  {nextStatus && !isFinal && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        updateStatus.mutate({ orderId: order.id, status: nextStatus });
                      }}
                      disabled={updateStatus.isPending}
                      className="flex-shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40"
                    >
                      {updateStatus.isPending && updateStatus.variables?.orderId === order.id
                        ? <Loader2 size={10} className="animate-spin" />
                        : <ChevronRight size={10} />
                      }
                      {nextStatus.replace('_', ' ')}
                    </button>
                  )}

                  <ChevronDown
                    size={15}
                    className={`text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded detail drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid md:grid-cols-3 gap-5 py-2">
                      {/* Column 1: Customer + Address */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</p>
                        <div className="space-y-2">
                          <InfoRow icon={<User size={12} />} label="Name" value={order.user.name ?? '—'} />
                          <InfoRow icon={<User size={12} />} label="Email" value={order.user.email} />
                        </div>
                      </div>

                      {/* Column 2: Items */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items ordered</p>
                        <div className="space-y-1.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                              <Package size={11} className="text-gray-300 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs font-black text-gray-900">Total: ₹{order.total.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Payment: <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
                          </p>
                        </div>
                      </div>

                      {/* Column 3: Status pipeline */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Change Status</p>
                        {isFinal ? (
                          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold ${STATUS_COLORS[order.status as OrderStatus]}`}>
                            <AlertTriangle size={12} />
                            Order is {order.status.toLowerCase()} — no further changes
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(s => {
                              const isCurrentOrPast = STATUS_FLOW.indexOf(s) <= STATUS_FLOW.indexOf(order.status as OrderStatus);
                              const isCurrent = s === order.status;
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatus.mutate({ orderId: order.id, status: s })}
                                  disabled={updateStatus.isPending || isCurrent}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                                    isCurrent
                                      ? STATUS_COLORS[s] + ' cursor-default'
                                      : 'bg-white border-gray-100 text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-40'
                                  }`}
                                >
                                  {updateStatus.isPending && updateStatus.variables?.status === s && updateStatus.variables?.orderId === order.id
                                    ? <Loader2 size={11} className="animate-spin" />
                                    : isCurrent ? <ChevronRight size={11} /> : <ChevronLeft size={11} className="opacity-0" />
                                  }
                                  {s.replace('_', ' ')}
                                  {isCurrent && <span className="ml-auto text-[9px] uppercase tracking-widest opacity-60">Current</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-300 flex-shrink-0">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-10 flex-shrink-0">{label}</span>
      <span className="text-xs font-bold text-gray-700 truncate">{value}</span>
    </div>
  );
}