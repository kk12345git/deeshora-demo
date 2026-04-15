"use client";

import { trpc } from "@/lib/trpc";
import { 
  IndianRupee, TrendingUp, Calendar, 
  PackageCheck, ArrowRight, Loader2,
  Wallet, ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function EarningsPage() {
  const { data: stats, isLoading: statsLoading } = trpc.delivery.getStats.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.delivery.getEarningsHistory.useQuery();

  if (statsLoading || historyLoading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      <p className="text-gray-500 font-medium">Calculating your earnings...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 opacity-80">
               <Wallet size={16} />
               <span className="text-xs font-black uppercase tracking-widest">Total Balance</span>
            </div>
            <div className="flex items-baseline gap-2 mb-8">
               <span className="text-5xl font-black">₹{stats?.totalEarnings.toLocaleString()}</span>
               <TrendingUp size={24} className="text-blue-200" />
            </div>
            <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-70">This Week</span>
                  <span className="text-lg font-black">₹{stats?.weeklyEarnings.toLocaleString()}</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-70">Completed</span>
                  <span className="text-lg font-black">{stats?.lifetimeDeliveries}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Highlights Section */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-3">
               <Calendar size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Today</span>
            <span className="text-xl font-black text-gray-200">₹{stats?.todayEarnings.toLocaleString()}</span>
         </div>
         <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
               <PackageCheck size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Success Rate</span>
            <span className="text-xl font-black text-gray-200">100%</span>
         </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-gray-100 uppercase tracking-[0.2em] italic">Payout History</h3>
            <span className="text-[10px] font-bold text-blue-500 uppercase">Recent 30</span>
         </div>

         {!history || history.length === 0 ? (
            <div className="bg-gray-900/40 border-2 border-dashed border-gray-800 rounded-[2rem] py-12 text-center">
               <p className="text-gray-500 text-sm font-medium">No payouts recorded yet.</p>
            </div>
         ) : (
            <div className="space-y-3">
               {history.map((item) => (
                  <Link 
                     key={item.id}
                     href={`/delivery/orders/${item.id}`}
                     className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between group hover:border-blue-500/50 transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                           <IndianRupee size={20} />
                        </div>
                        <div>
                           <p className="font-black text-gray-200 text-sm">{item.vendor.shopName}</p>
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                              {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Pending'}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-lg font-black text-white">+₹{item.deliveryFee}</div>
                        <div className="text-[10px] text-green-500 font-black uppercase tracking-widest">Credited</div>
                     </div>
                  </Link>
               ))}
            </div>
         )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:bg-blue-500/10 transition-all">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
               ?
            </div>
            <div>
               <p className="text-sm font-black text-gray-100">Payout Schedule</p>
               <p className="text-xs text-gray-500">Earnings are credited every Tuesday</p>
            </div>
         </div>
         <ArrowRight size={18} className="text-gray-700 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  );
}
