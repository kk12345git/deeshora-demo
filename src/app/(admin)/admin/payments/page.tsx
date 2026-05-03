// src/app/(admin)/admin/payments/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { Check, X, Loader2, IndianRupee, CreditCard, User, Store, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const { data, isLoading, refetch } = trpc.admin.getPendingVerifications.useQuery();
  
  const approvePayment = trpc.admin.approvePayment.useMutation({
    onSuccess: () => {
      toast.success('Order payment approved!');
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const approveSubscription = trpc.admin.approveSubscription.useMutation({
    onSuccess: () => {
      toast.success('Vendor subscription approved!');
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Payment Verifications</h1>
        <p className="text-gray-500 font-bold">Review and approve manual UPI transfers (UTR based)</p>
      </div>

      {/* Customer Orders Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
            <User className="text-orange-600" size={20} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Customer Orders</h2>
          <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full">
            {data?.pendingOrders.length || 0} PENDING
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.pendingOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 hover:border-orange-500 transition-all group shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                  <p className="font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl">
                  <p className="text-orange-900 font-black text-lg">₹{order.total}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center">
                    <User size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="text-sm font-bold text-gray-900">{order.user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center">
                    <Store size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor</p>
                    <p className="text-sm font-bold text-gray-900">{order.vendor.shopName}</p>
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">UTR NUMBER</p>
                  <p className="text-white font-mono font-black text-lg tracking-wider">{order.utrNumber}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => approvePayment.mutate({ orderId: order.id })}
                  disabled={approvePayment.isPending}
                  className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {approvePayment.isPending ? <Loader2 className="animate-spin" /> : 'Approve'}
                </button>
                <button className="w-14 h-14 border-2 border-gray-100 rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
          {data?.pendingOrders.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No pending customer payments</p>
            </div>
          )}
        </div>
      </section>

      {/* Vendor Subscriptions Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Store className="text-blue-600" size={20} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Vendor Subscriptions</h2>
          <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full">
            {data?.pendingSubscriptions.length || 0} PENDING
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.pendingSubscriptions.map((vendor) => (
            <div key={vendor.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 hover:border-blue-500 transition-all group shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan</p>
                  <p className="font-black text-blue-600 uppercase">Premium Upgrade</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl">
                  <p className="text-blue-900 font-black text-lg">₹700</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center">
                    <Store size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop Name</p>
                    <p className="text-sm font-bold text-gray-900">{vendor.shopName}</p>
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">UTR NUMBER</p>
                  <p className="text-white font-mono font-black text-lg tracking-wider">{vendor.subscriptionUtr}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => approveSubscription.mutate({ vendorId: vendor.id })}
                  disabled={approveSubscription.isPending}
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {approveSubscription.isPending ? <Loader2 className="animate-spin" /> : 'Approve Premium'}
                </button>
                <button className="w-14 h-14 border-2 border-gray-100 rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
          {data?.pendingSubscriptions.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No pending vendor subscriptions</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
