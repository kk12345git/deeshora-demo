"use client";

import { trpc } from "@/lib/trpc";
import { 
  Package, MapPin, Phone, MessageSquare, 
  ArrowLeft, Navigation, ShoppingBag, 
  Loader2, AlertCircle, Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SwipeButton from "@/components/delivery/SwipeButton";
import { WHATSAPP_TEMPLATES, getWhatsAppUrl } from "@/lib/whatsapp";
import toast from "react-hot-toast";
import Image from "next/image";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const orderId = params?.id;
  const { data: order, isLoading, error, refetch } = trpc.delivery.getOrderDetails.useQuery({ 
    orderId: orderId as string 
  }, { enabled: !!orderId });

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
      
      router.push("/delivery");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      <p className="text-gray-500 font-medium">Fetching order data...</p>
    </div>
  );

  if (error || !order) return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-200 mb-2">Order Not Found</h2>
      <p className="text-gray-500 mb-8">{error?.message || "This order may have been cancelled or assigned to someone else."}</p>
      <Link href="/delivery" className="btn-primary px-8">Return to Dashboard</Link>
    </div>
  );

  const isAssigned = order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-black text-white italic">Task Details</h2>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Order #{order.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-3xl flex items-center justify-between ${
        isAssigned ? "bg-blue-500/10 border border-blue-500/20" : "bg-green-500/10 border border-green-500/20"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAssigned ? "text-blue-500" : "text-green-500"}`}>
            <Clock size={18} />
          </div>
          <span className={`text-xs font-black uppercase tracking-widest ${isAssigned ? "text-blue-500" : "text-green-500"}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-500">
          Updated {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Customer & Vendor Info */}
      <div className="grid gap-4">
        {/* Customer Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex justify-between items-start">
             <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Customer</h4>
                <p className="text-lg font-black text-white">{order.user.name}</p>
             </div>
             <div className="flex gap-2">
                {order.user.phone && (
                   <>
                      <a 
                        href={`tel:${order.user.phone}`}
                        className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-blue-500 border border-gray-700 hover:bg-gray-700 transition-all"
                      >
                        <Phone size={18} />
                      </a>
                      <a 
                        href={getWhatsAppUrl(order.user.phone, WHATSAPP_TEMPLATES.LOCATION_REQUEST(order.id, order.vendor.shopName))}
                        target="_blank"
                        className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-green-500 border border-gray-700 hover:bg-gray-700 transition-all"
                      >
                        <MessageSquare size={18} />
                      </a>
                   </>
                )}
             </div>
          </div>
          
          <div className="flex items-start gap-3 pt-4 border-t border-gray-800/50">
             <MapPin size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Drop Location</span>
                   <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.line1}, ${order.address.city}, ${order.address.pincode}`)}`}
                    target="_blank"
                    className="text-[10px] text-gray-500 hover:text-white flex items-center gap-0.5"
                   >
                     Navigate <Navigation size={8} />
                   </a>
                </div>
                <p className="text-sm font-medium text-gray-300 leading-relaxed">
                   {order.address.line1}, {order.address.line2 ? `${order.address.line2}, ` : ''}{order.address.city} - {order.address.pincode}
                </p>
             </div>
          </div>
        </div>

        {/* Pickup Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 space-y-4">
           <div>
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pickup from</h4>
              <p className="text-lg font-black text-white">{order.vendor.shopName}</p>
           </div>
           
           <div className="flex items-start gap-3">
              <Package size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                 <p className="text-sm font-medium text-gray-300">
                    {order.vendor.address}, {order.vendor.city}
                 </p>
                 <a href={`tel:${order.vendor.phone}`} className="text-xs text-orange-500 font-bold mt-2 inline-block">Call Vendor</a>
              </div>
           </div>
        </div>
      </div>

      {/* Package Items */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 px-2">
            <ShoppingBag size={18} className="text-gray-500" />
            <h3 className="text-sm font-black text-gray-100 uppercase tracking-[0.1em]">Package Contents</h3>
            <span className="ml-auto text-[10px] font-bold text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
               {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items
            </span>
         </div>
         
         <div className="bg-gray-900/50 border border-gray-800 rounded-[2rem] overflow-hidden">
            {order.items.map((item, idx) => (
               <div key={idx} className={`p-4 flex items-center justify-between ${idx !== order.items.length - 1 ? 'border-b border-gray-800/50' : ''}`}>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                           <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                           <Package size={20} className="text-gray-600" />
                        )}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-200">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Footer Action */}
      {isAssigned && (
         <div className="pt-4 px-2">
            <SwipeButton 
              label="Slide to Complete order"
              successLabel="Delivered"
              onComplete={() => completeMutation.mutate({ orderId: order.id })}
              disabled={completeMutation.isPending}
            />
         </div>
      )}
    </div>
  );
}
