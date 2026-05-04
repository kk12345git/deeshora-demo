"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Package, MapPin, Phone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function OrderPoolPage() {
  const { data: orders, isLoading, refetch } = trpc.delivery.getPool.useQuery();
  const claimMutation = trpc.delivery.claimOrder.useMutation({
    onSuccess: () => {
      toast.success("Order claimed! Move to My Tasks.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="py-12 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      <p className="text-gray-500 font-medium">Scanning for available orders...</p>
    </div>
  );

  if (!orders || orders.length === 0) return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-gray-700 mb-6">
        <Package size={40} />
      </div>
      <h2 className="text-xl font-bold text-gray-200 mb-2">No Orders Available</h2>
      <p className="text-gray-500 max-w-xs mx-auto">All orders are currently claimed or being prepared. Check back in a few minutes!</p>
      <button 
        onClick={() => refetch()}
        className="mt-8 px-6 py-3 bg-gray-900 border border-gray-800 rounded-2xl hover:bg-gray-800 transition-colors font-bold text-sm"
      >
        Refresh Pool
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-gray-100 italic">Order Pool</h2>
          <p className="text-gray-500 text-sm font-medium">Available for immediate pickup</p>
        </div>
        <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20">
          {orders.length} Active
        </div>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Link 
            href={`/delivery/orders/${order.id}`}
            key={order.id} 
            className="group bg-gray-900/40 backdrop-blur-md rounded-[2rem] border border-gray-800 p-6 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden block active:scale-[0.98]"
          >
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 block">Order ID</span>
                <span className="text-lg font-black font-mono text-gray-200">#{order.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-black uppercase border border-green-500/20">
                READY
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 mt-1 flex-shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Pickup From</h4>
                  <p className="font-bold text-gray-200">{order.vendor.shopName}</p>
                  <p className="text-sm text-gray-400 line-clamp-1">{order.vendor.address}, {order.vendor.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 mt-1 flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Deliver To</h4>
                  <p className="font-bold text-gray-200">{order.address.city}</p>
                  <p className="text-sm text-gray-400 line-clamp-1">{order.address.line1}, {order.address.line2}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => claimMutation.mutate({ orderId: order.id })}
              disabled={claimMutation.isPending}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {claimMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Claim Order
                </>
              )}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
