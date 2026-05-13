"use client";

import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, IndianRupee, ShieldCheck, MessageCircle, AlertCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useUser } from '@clerk/nextjs';

export default function CartPage() {
  const { isSignedIn } = useUser();
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { data: config } = trpc.admin.getConfig.useQuery(undefined, { staleTime: Infinity });

  // Fetch real-time availability
  const { data: availabilityData, isFetching: isCheckingAvailability } = trpc.product.checkCartAvailability.useQuery(
    items.map(i => i.productId),
    { enabled: items.length > 0, refetchInterval: 15000 }
  );

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const clearCartMutation = trpc.cart.clear.useMutation();

  const handleUpdateQuantity = async (productId: string, quantity: number, currentStock?: number) => {
    // If real-time stock is known, cap the update
    const maxStock = currentStock !== undefined ? currentStock : Infinity;
    const finalQuantity = Math.min(quantity, maxStock);
    
    updateQuantity(productId, finalQuantity);
    if (isSignedIn) {
      try {
        await updateQuantityMutation.mutateAsync({ productId, quantity: finalQuantity });
      } catch (error) {
        console.error('Failed to sync quantity:', error);
      }
    }
  };

  const handleRemoveItem = async (productId: string) => {
    removeItem(productId);
    if (isSignedIn) {
      try {
        await removeItemMutation.mutateAsync({ productId });
      } catch (error) {
        console.error('Failed to sync remove item:', error);
      }
    }
  };

  const handleClearCart = async () => {
    clearCart();
    if (isSignedIn) {
      try {
        await clearCartMutation.mutateAsync();
      } catch (error) {
        console.error('Failed to sync clear cart:', error);
      }
    }
  };
  
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(299);

  useEffect(() => {
    if (config) {
      const fee = config.find((c: any) => c.key === 'delivery_fee')?.value;
      const threshold = config.find((c: any) => c.key === 'free_delivery_above')?.value;
      if (fee) setDeliveryFee(parseFloat(fee));
      if (threshold) setFreeDeliveryThreshold(parseFloat(threshold));
    }
  }, [config]);

  // Merge items with availability data
  const mergedItems = items.map(item => {
    const availability = availabilityData?.find(a => a.id === item.productId);
    const isAvailable = availability ? availability.isAvailable : true; // assume available until fetched
    const realStock = availability ? availability.stock : item.stock;
    const isExceedingStock = item.quantity > realStock;
    return { ...item, isAvailable, realStock, isExceedingStock };
  });

  const hasUnavailableItems = mergedItems.some(i => !i.isAvailable || i.isExceedingStock);
  const cartTotal = total();
  const hasPhysicalItems = mergedItems.some(item => item.type === 'PHYSICAL');
  const isEligibleForFreeDelivery = cartTotal >= freeDeliveryThreshold || !hasPhysicalItems;
  const finalDeliveryFee = isEligibleForFreeDelivery ? 0 : deliveryFee;
  const grandTotal = cartTotal + finalDeliveryFee;
  const amountForFreeDelivery = freeDeliveryThreshold - cartTotal;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="w-32 h-32 bg-brand-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8 animate-float">
           <ShoppingBag size={48} className="text-brand-500" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Your bag is empty</h1>
        <p className="mt-4 text-gray-500 font-medium max-w-xs mx-auto">Looks like you haven&apos;t discovered anything amazing yet.</p>
        <Link href="/" className="btn-primary mt-10">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-10">
         <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">My Bag</h1>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">{items.length} Items Selected</p>
         </div>
         <button onClick={handleClearCart} className="text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-full transition-colors">
            Clear all
         </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="popLayout">
            {mergedItems.map((item) => (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative border p-6 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${!item.isAvailable ? 'bg-red-50 border-red-100 opacity-75' : item.isExceedingStock ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100 hover:shadow-gray-200/50'}`}
              >
              <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 shadow-inner bg-gray-50 border border-gray-50 relative">
                 <Image src={item.image} alt={item.name} width={120} height={120} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${!item.isAvailable ? 'grayscale opacity-60' : ''}`} />
                 {!item.isAvailable && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                     <span className="text-[10px] font-black uppercase text-white bg-red-500 px-2 py-1 rounded">Unavailable</span>
                   </div>
                 )}
              </div>
              <div className="flex-grow text-center sm:text-left">
                <p className="text-lg font-black text-gray-900 leading-tight mb-1">{item.name}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-brand-600 font-black">
                   <IndianRupee size={14} />
                   <span>{item.price}</span>
                </div>
                {item.isExceedingStock && item.isAvailable && (
                  <p className="text-xs font-bold text-amber-600 mt-2 flex items-center justify-center sm:justify-start gap-1">
                    <AlertCircle size={12} /> Only {item.realStock} left in stock
                  </p>
                )}
                {!item.isAvailable && (
                  <p className="text-xs font-bold text-red-600 mt-2 flex items-center justify-center sm:justify-start gap-1">
                    <AlertCircle size={12} /> This item is no longer available
                  </p>
                )}
              </div>
              
              <div className="flex sm:flex-col items-center sm:items-end gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
                 <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-1 shadow-inner">
                   <button 
                     onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.realStock)} 
                     className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:text-brand-500 rounded-xl transition-all shadow-sm"
                   >
                     <Minus size={14} />
                   </button>
                   <span className="w-10 text-center text-sm font-black text-gray-800">{item.quantity}</span>
                   <button 
                     onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.realStock)} 
                     disabled={item.quantity >= item.realStock}
                     className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:text-brand-500 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                   >
                     <Plus size={14} />
                   </button>
                 </div>
                 <button onClick={() => handleRemoveItem(item.productId)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                   <Trash2 size={18} />
                 </button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-gray-950 rounded-[3rem] p-8 text-white sticky top-24 shadow-2xl shadow-brand-500/10 overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand-500/20 transition-all duration-1000" />
            
            <h2 className="text-2xl font-black italic mb-8 relative z-10 uppercase tracking-tight">Summary</h2>
            
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-4">
                <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                <div className="flex items-center gap-1 font-black text-white">
                   <IndianRupee size={12} />
                   <span>{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-4">
                <span className="text-xs font-black uppercase tracking-widest">Delivery Fee</span>
                <span className={`text-xs font-black uppercase tracking-wider ${isEligibleForFreeDelivery ? 'text-green-400' : 'text-white'}`}>
                   {!hasPhysicalItems ? 'Not Applicable' : (isEligibleForFreeDelivery ? 'Complimentary' : `₹${deliveryFee}`)}
                </span>
              </div>

              <div className="pt-4 flex justify-between items-baseline">
                <span className="text-xs font-black text-brand-500 uppercase tracking-widest">Total Pay</span>
                <div className="flex items-center gap-1.5 text-4xl font-black italic">
                   <IndianRupee size={24} className="text-brand-500" />
                   <span>{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {!isEligibleForFreeDelivery && amountForFreeDelivery > 0 && hasPhysicalItems && (
              <div className="mt-10 bg-white/5 border border-white/10 p-5 rounded-2xl relative z-10 text-center group/free transition-all hover:bg-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mb-1">Free Delivery Unlock</p>
                <p className="text-sm font-bold text-gray-200">Add <span className="text-white font-black">₹{amountForFreeDelivery}</span> more items</p>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                   <div 
                     className="bg-brand-500 h-full transition-all duration-1000" 
                     style={{ width: `${(cartTotal / freeDeliveryThreshold) * 100}%` }}
                   />
                </div>
              </div>
            )}

            <div className="mt-10 relative z-10">
              {hasUnavailableItems ? (
                 <button disabled className="btn-primary w-full py-5 text-base flex gap-3 opacity-50 cursor-not-allowed">
                   <AlertCircle size={18} /> Update Cart to Continue
                 </button>
              ) : (
                <Link href="/checkout" className="btn-primary w-full py-5 text-base flex gap-3 group/btn">
                  <span>Secure Checkout</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <button 
                disabled={hasUnavailableItems}
                onClick={() => {
                  const businessNumber = config?.find((c: any) => c.key === 'business_whatsapp')?.value || '918939318865';
                  const itemsList = items.map(i => `• ${i.quantity}x ${i.name} (₹${i.price})`).join('\n');
                  const message = `Hi Daily1Mart! 🌟\n\nI want to order via WhatsApp!\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${grandTotal}\n\nPlease help me complete this order! 🙏`;
                  window.open(getWhatsAppUrl(businessNumber, message), '_blank');
                }}
                className="w-full mt-3 py-4 border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <MessageCircle size={18} fill="currentColor" /> Order via WhatsApp
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-40 relative z-10">
               <ShieldCheck size={14} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">100% Secured Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}