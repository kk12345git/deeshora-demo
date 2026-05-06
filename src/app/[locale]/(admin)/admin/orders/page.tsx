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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fulfillment Center</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Order Pipeline</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Monitoring <span className="text-gray-900 font-bold">{allOrders.length} transactions</span> in the current lifecycle.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ID, customer, vendor..."
              className="w-full pl-11 pr-5 py-3.5 text-sm bg-white border border-gray-200 rounded-[1.25rem] focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 font-bold transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="w-12 h-12 bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 transition-all shadow-sm active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-orange-500' : ''} />
          </button>
        </div>
      </div>

      {/* Operational Pulse */}
      <div className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-[1.75rem] shadow-sm w-fit overflow-x-auto max-w-full no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gray-950 text-white shadow-xl shadow-gray-950/20'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'ALL' ? 'Everything' : tab.replace('_', ' ')}
            {counts[tab] !== undefined && counts[tab]! > 0 && (
              <span className={`min-w-[1.25rem] h-5 flex items-center justify-center text-[9px] font-black px-1 rounded-md ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
             <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
             <div className="absolute inset-0 blur-xl bg-orange-500/20 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-gray-400 animate-pulse">Scanning live transactions...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <ShoppingCart size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900">No Orders in View</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Try adjusting your filters or wait for new incoming requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order, i) => {
            const isExpanded = expandedId === order.id;
            const statusIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
            const nextStatus = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1
              ? STATUS_FLOW[statusIdx + 1]
              : null;
            const isFinal = order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'REFUNDED';

            return (
              <div 
                key={order.id} 
                className={`group bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-orange-200 ring-4 ring-orange-500/5 shadow-2xl shadow-orange-500/10' : 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200'
                }`}
              >
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center gap-6 px-6 py-5 text-left relative overflow-hidden"
                >
                  {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />}

                  {/* Icon / Status */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all shadow-inner ${
                      order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                      order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                      order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      <ShoppingCart size={24} className={order.status === 'OUT_FOR_DELIVERY' ? 'animate-bounce' : ''} />
                    </div>
                  </div>

                  {/* Order Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-gray-900 text-lg tracking-tight uppercase">#{order.id.slice(-6)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                      <span className="text-gray-900 font-bold">{order.user.name}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className="truncate">{order.vendor.shopName}</span>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="hidden lg:flex items-center gap-10 px-8 border-x border-gray-50">
                    <div className="text-center">
                       <p className="font-black text-gray-900 text-base tracking-tighter">₹{order.total.toLocaleString('en-IN')}</p>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Value</p>
                    </div>
                    <div className="text-center">
                       <p className="font-black text-gray-900 text-base tracking-tighter">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                       </p>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Placing Date</p>
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="flex items-center gap-4">
                    {nextStatus && !isFinal && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateStatus.mutate({ orderId: order.id, status: nextStatus });
                        }}
                        disabled={updateStatus.isPending}
                        className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-40"
                      >
                        {updateStatus.isPending && updateStatus.variables?.orderId === order.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ChevronRight size={12} />
                        }
                        Advance to {nextStatus.replace('_', ' ')}
                      </button>
                    )}

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300 group-hover:text-gray-600 group-hover:bg-gray-100'}`}>
                      <ChevronDown size={20} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expanded Drawer */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2">
                    <div className="grid lg:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                      {/* Customer Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <User size={14} className="text-orange-500" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recipient Info</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3 shadow-sm">
                          <InfoRow icon={<User size={12} />} label="Client" value={order.user.name ?? 'Guest User'} />
                          <InfoRow icon={<ShoppingCart size={12} />} label="Email" value={order.user.email} />
                          <div className="pt-2 border-t border-gray-50">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Shipping to</p>
                             <div className="flex gap-2">
                                <MapPin size={12} className="text-gray-300 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                                   {order.city} Marketplace Fulfillment
                                </p>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <Package size={14} className="text-orange-500" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Manifest</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4 shadow-sm">
                          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between gap-4 py-1">
                                <div className="flex items-center gap-3 min-w-0">
                                   <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Package size={12} className="text-gray-400" />
                                   </div>
                                   <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{item.name}</p>
                                </div>
                                <p className="text-xs font-black text-orange-600">₹{item.price}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-4 border-t border-gray-100 space-y-2">
                             <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Status</p>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                   {order.paymentStatus}
                                </span>
                             </div>
                             <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Final Total</p>
                                <p className="text-lg font-black text-gray-900 tracking-tighter">₹{order.total.toFixed(0)}</p>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Workflow Transition */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-white rounded-lg shadow-sm">
                              <RefreshCw size={14} className="text-orange-500" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Process State</p>
                        </div>
                        {isFinal ? (
                          <div className={`p-5 rounded-2xl border-2 border-dashed text-center flex flex-col items-center gap-3 ${
                             order.status === 'DELIVERED' ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'
                          }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === 'DELIVERED' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                               <CheckCircle size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black uppercase tracking-widest">Order {order.status}</p>
                               <p className="text-[10px] font-medium opacity-70 mt-1">Lifecycle completed for this transaction.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {(['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(s => {
                              const isCurrent = s === order.status;
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatus.mutate({ orderId: order.id, status: s })}
                                  disabled={updateStatus.isPending || isCurrent}
                                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isCurrent
                                      ? 'bg-gray-950 border-gray-900 text-white shadow-lg'
                                      : 'bg-white border-gray-100 text-gray-400 hover:border-orange-300 hover:text-orange-600 active:scale-[0.98] disabled:opacity-40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                     {updateStatus.isPending && updateStatus.variables?.status === s && updateStatus.variables?.orderId === order.id
                                        ? <Loader2 size={12} className="animate-spin text-orange-500" />
                                        : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-orange-500 animate-pulse' : 'bg-gray-200'}`} />
                                     }
                                     {s.replace('_', ' ')}
                                  </div>
                                  {isCurrent && <ChevronRight size={12} className="text-orange-500" />}
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