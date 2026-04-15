"use client";

import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, IndianRupee, ShieldCheck } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';

export default function CartPage() {
  const { isSignedIn } = useUser();
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { data: config } = trpc.admin.getConfig.useQuery(undefined, { staleTime: Infinity });

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const clearCartMutation = trpc.cart.clear.useMutation();

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
    if (isSignedIn) {
      try {
        await updateQuantityMutation.mutateAsync({ productId, quantity });
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

  const cartTotal = total();
  const isEligibleForFreeDelivery = cartTotal >= freeDeliveryThreshold;
  const finalDeliveryFee = isEligibleForFreeDelivery ? 0 : deliveryFee;
  const grandTotal = cartTotal + finalDeliveryFee;
  const amountForFreeDelivery = freeDeliveryThreshold - cartTotal;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="w-32 h-32 bg-orange-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8 animate-float">
           <ShoppingBag size={48} className="text-orange-500" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Your bag is empty</h1>
        <p className="mt-4 text-gray-500 font-medium max-w-xs mx-auto">Looks like you haven't discovered anything amazing yet.</p>
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
          {items.map((item) => (
            <div key={item.productId} className="group relative bg-white border border-gray-100 p-6 rounded-[2.5rem] flex items-center gap-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-1">
              <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 shadow-inner bg-gray-50 border border-gray-50">
                 <Image src={item.image} alt={item.name} width={120} height={120} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex-grow">
                <p className="text-lg font-black text-gray-900 leading-tight mb-1">{item.name}</p>
                <div className="flex items-center gap-2 text-orange-600 font-black">
                   <IndianRupee size={14} />
                   <span>{item.price}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4">
                 <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-1 shadow-inner">
                   <button 
                     onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} 
                     className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:text-orange-500 rounded-xl transition-all shadow-sm"
                   >
                     <Minus size={14} />
                   </button>
                   <span className="w-10 text-center text-sm font-black text-gray-800">{item.quantity}</span>
                   <button 
                     onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} 
                     className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:text-orange-500 rounded-xl transition-all shadow-sm"
                   >
                     <Plus size={14} />
                   </button>
                 </div>
                 <button onClick={() => handleRemoveItem(item.productId)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                   <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-gray-950 rounded-[3rem] p-8 text-white sticky top-24 shadow-2xl shadow-orange-500/10 overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-500/20 transition-all duration-1000" />
            
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
                   {isEligibleForFreeDelivery ? 'Complimentary' : `₹${deliveryFee}`}
                </span>
              </div>

              <div className="pt-4 flex justify-between items-baseline">
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Total Pay</span>
                <div className="flex items-center gap-1.5 text-4xl font-black italic">
                   <IndianRupee size={24} className="text-orange-500" />
                   <span>{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {!isEligibleForFreeDelivery && amountForFreeDelivery > 0 && (
              <div className="mt-10 bg-white/5 border border-white/10 p-5 rounded-2xl relative z-10 text-center group/free transition-all hover:bg-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">Free Delivery Unlock</p>
                <p className="text-sm font-bold text-gray-200">Add <span className="text-white font-black">₹{amountForFreeDelivery}</span> more items</p>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                   <div 
                     className="bg-orange-500 h-full transition-all duration-1000" 
                     style={{ width: `${(cartTotal / freeDeliveryThreshold) * 100}%` }}
                   />
                </div>
              </div>
            )}

            <div className="mt-10 relative z-10">
              <Link href="/checkout" className="btn-primary w-full py-5 text-base flex gap-3 group/btn">
                <span>Secure Checkout</span>
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
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