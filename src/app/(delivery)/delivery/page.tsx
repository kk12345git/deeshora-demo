"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { 
  Package, MapPin, Phone, ExternalLink, 
  Navigation, MessageSquare, Loader2 
} from "lucide-react";
import SwipeButton from "@/components/delivery/SwipeButton";
import { WHATSAPP_TEMPLATES, getWhatsAppUrl } from "@/lib/whatsapp";
import toast from "react-hot-toast";

export default function MyTasksPage() {
  const { data: stats } = trpc.delivery.getStats.useQuery();
  const { data: tasks, isLoading, refetch } = trpc.delivery.getMyTasks.useQuery();

  const completeMutation = trpc.delivery.completeOrder.useMutation({
    onSuccess: (data) => {
      toast.success("Delivery confirmed!");
      refetch();
      
      // Automatic WhatsApp confirmation logic
      if (data.customerPhone) {
        const message = `Hello ${data.customerName}! Your order from ${data.shopName} has been delivered. Thank you for shopping with Deeshora!`;
        const url = getWhatsAppUrl(data.customerPhone, message);
        window.open(url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="py-12 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      <p className="text-gray-500 font-medium">Loading your active tasks...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-4">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-3xl">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Today</span>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-green-500">{stats?.completedToday || 0}</span>
               <span className="text-xs font-bold text-gray-400">Done</span>
            </div>
         </div>
         <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-3xl">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Status</span>
            <div className="flex items-center gap-2 mt-2">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-sm font-black text-gray-200 uppercase tracking-wider">Active</span>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-100 italic tracking-tight">Active Tasks</h2>
        <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/20">
           {tasks?.length || 0}
        </div>
      </div>

      {(!tasks || tasks.length === 0) ? (
        <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[2.5rem] py-16 px-8 text-center">
           <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-700 mx-auto mb-4">
              <Package size={30} />
           </div>
           <h3 className="text-lg font-bold text-gray-200 mb-2">No active deliveries</h3>
           <p className="text-sm text-gray-500 mb-6">Claim an order from the pool to get started.</p>
           <a 
            href="/delivery/pool"
            className="inline-flex items-center gap-2 text-blue-500 text-sm font-black uppercase tracking-widest hover:text-blue-400 transition-colors"
           >
              Go to Pool <ExternalLink size={14} />
           </a>
        </div>
      ) : (
        <div className="grid gap-6">
          {tasks.map((task) => (
            <Link 
              href={`/delivery/orders/${task.id}`}
              key={task.id}
              className="bg-gray-900 rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl shadow-black/50 block group active:scale-[0.98] transition-all"
            >
              {/* Order Header */}
              <div className="p-6 bg-gray-800/30 border-b border-gray-800/50 flex justify-between items-center">
                 <div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Customer</h4>
                    <p className="text-lg font-black text-gray-100">{task.user.name}</p>
                 </div>
                 <div className="flex gap-2">
                    {task.user.phone && (
                       <>
                          <a 
                            href={`tel:${task.user.phone}`}
                            className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-blue-500 hover:bg-gray-700 transition-colors border border-gray-700"
                          >
                            <Phone size={20} />
                          </a>
                          <a 
                            href={getWhatsAppUrl(task.user.phone, WHATSAPP_TEMPLATES.LOCATION_REQUEST(task.id, task.vendor.shopName))}
                            className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-green-500 hover:bg-gray-700 transition-colors border border-gray-700"
                            target="_blank"
                          >
                            <MessageSquare size={20} />
                          </a>
                       </>
                    )}
                 </div>
              </div>

              {/* Delivery Details */}
              <div className="p-6 space-y-6">
                 {/* Pickup */}
                 <div className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                       <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-gray-950 z-10" />
                       <div className="w-0.5 h-full bg-gray-800 border-dashed border-l" />
                    </div>
                    <div>
                       <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Pickup</h5>
                       <p className="text-sm font-bold text-gray-200 mb-1">{task.vendor.shopName}</p>
                       <p className="text-xs text-gray-400 leading-relaxed font-medium">
                          {task.vendor.address}, {task.vendor.city}
                       </p>
                    </div>
                 </div>

                 {/* Drop */}
                 <div className="flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10" />
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-2">
                          <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Drop-off</h5>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${task.address.line1}, ${task.address.city}, ${task.address.pincode}`)}`}
                            target="_blank"
                            className="text-[10px] font-black text-gray-500 flex items-center gap-1 hover:text-blue-500 transition-colors uppercase"
                          >
                             Map <Navigation size={10} />
                          </a>
                       </div>
                       <p className="text-sm font-bold text-gray-200 mb-1">{task.address.city}</p>
                       <p className="text-xs text-gray-400 leading-relaxed font-medium">
                          {task.address.line1}, {task.address.line2 ? `${task.address.line2}, ` : ''}{task.address.pincode}
                       </p>
                    </div>
                 </div>

                 {/* Swipe to Complete */}
                 <div className="pt-4">
                    <SwipeButton 
                      label="Swipe to Complete Delivery"
                      successLabel="Delivered"
                      onComplete={() => completeMutation.mutate({ orderId: task.id })}
                      disabled={completeMutation.isPending}
                    />
                 </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
