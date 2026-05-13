// src/app/(admin)/admin/payments/page.tsx
"use client";

import { trpc } from "@/lib/trpc";
import {
  Check,
  X,
  Loader2,
  IndianRupee,
  CreditCard,
  User,
  Store,
  AlertCircle,
  CheckCircle,
  Users,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminPaymentsPage() {
  const { data, isLoading, refetch } =
    trpc.admin.getPendingVerifications.useQuery();

  const approvePayment = trpc.admin.approvePayment.useMutation({
    onSuccess: () => {
      toast.success("Order payment approved!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveSubscription = trpc.admin.approveSubscription.useMutation({
    onSuccess: () => {
      toast.success("Vendor subscription approved!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Financial Security
            </p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Payment Verifications
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Authenticating{" "}
            <span className="text-gray-900 font-bold">
              manual UTR settlements
            </span>{" "}
            for orders and subscriptions.
          </p>
        </div>
      </div>

      {/* Customer Orders Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
              <User className="text-brand-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Customer Settlements
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                Transactional Integrity Protocol
              </p>
            </div>
          </div>
          <div className="bg-brand-500 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-brand-500/20">
            {data?.pendingOrders.length || 0} AWAITING AUDIT
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.pendingOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <CreditCard size={120} />
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
                    Asset Reference
                  </p>
                  <p className="font-mono font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="bg-brand-600 text-white px-5 py-2.5 rounded-[1.25rem] shadow-xl shadow-brand-600/10">
                  <p className="font-black text-xl tracking-tighter">
                    ₹{order.total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-5 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Originator
                    </p>
                    <p className="text-sm font-black text-gray-950 uppercase tracking-tight">
                      {order.user.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Store size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Destination
                    </p>
                    <p className="text-sm font-black text-gray-950 uppercase tracking-tight">
                      {order.vendor?.shopName ?? "Direct Order"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-950 p-5 rounded-[1.5rem] border border-white/5 shadow-2xl">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
                    Manual UTR Terminal
                  </p>
                  <p className="text-emerald-400 font-mono font-black text-xl tracking-[0.15em] break-all uppercase">
                    {order.utrNumber}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button
                  onClick={() => approvePayment.mutate({ orderId: order.id })}
                  disabled={approvePayment.isPending}
                  className="flex-1 h-14 bg-gray-950 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95 shadow-xl"
                >
                  {approvePayment.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Verify Asset
                </button>
                <button className="w-14 h-14 border border-gray-100 rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all flex items-center justify-center active:scale-95">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          ))}

          {data?.pendingOrders.length === 0 && (
            <div className="col-span-full py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Queue Depleted
              </h3>
              <p className="text-gray-400 text-sm mt-2 font-medium">
                All customer order payments have been successfully audited.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Vendor Subscriptions Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
              <Store className="text-blue-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Tier Subscriptions
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                Platform Escalation Requests
              </p>
            </div>
          </div>
          <div className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20">
            {data?.pendingSubscriptions.length || 0} PENDING ESCALATION
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.pendingSubscriptions.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-100 hover:shadow-2xl hover:shadow-blue-100/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:-rotate-12 transition-transform duration-700">
                <Shield size={120} />
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
                    Account Tier
                  </p>
                  <p className="font-black text-blue-600 uppercase tracking-widest text-sm">
                    Elite Hub Upgrade
                  </p>
                </div>
                <div className="bg-blue-600 text-white px-5 py-2.5 rounded-[1.25rem] shadow-xl shadow-blue-600/10">
                  <p className="font-black text-xl tracking-tighter">₹700</p>
                </div>
              </div>

              <div className="space-y-5 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Store size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Merchant Identity
                    </p>
                    <p className="text-sm font-black text-gray-950 uppercase tracking-tight">
                      {vendor.shopName}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-950 p-5 rounded-[1.5rem] border border-white/5 shadow-2xl">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
                    Subscription Terminal
                  </p>
                  <p className="text-blue-400 font-mono font-black text-xl tracking-[0.15em] break-all uppercase">
                    {vendor.subscriptionUtr}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button
                  onClick={() =>
                    approveSubscription.mutate({ vendorId: vendor.id })
                  }
                  disabled={approveSubscription.isPending}
                  className="flex-1 h-14 bg-gray-950 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95 shadow-xl"
                >
                  {approveSubscription.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Shield size={18} />
                  )}
                  Authorize Upgrade
                </button>
                <button className="w-14 h-14 border border-gray-100 rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all flex items-center justify-center active:scale-95">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          ))}

          {data?.pendingSubscriptions.length === 0 && (
            <div className="col-span-full py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Users size={32} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                System Optimized
              </h3>
              <p className="text-gray-400 text-sm mt-2 font-medium">
                All merchant tier upgrades have been processed.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
