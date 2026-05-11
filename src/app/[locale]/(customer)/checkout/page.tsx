// src/app/(customer)/checkout/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import { trpc } from '@/lib/trpc';
import { useRouter, Link } from "@/navigation";
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Home, Plus, Loader2, Tag, X, CheckCircle, ShieldCheck,
  Banknote, ChevronRight, Check,
  ArrowRight, CreditCard, Star,
  AlertCircle, FileText,
} from 'lucide-react';

type PaymentStep = 'SELECT' | 'DONE';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: addresses, isLoading: isLoadingAddresses } = trpc.user.myAddresses.useQuery();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('SELECT');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'MANUAL_UPI'>('MANUAL_UPI');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | { id: string; code: string; discount: number; description: string }>(null);
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([]);

  const addAddressMutation = trpc.user.addAddress.useMutation({
    onSuccess: () => {
      utils.user.myAddresses.invalidate();
      toast.success('Address added!');
      setShowNewAddressForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const placeOrderMutation = trpc.order.placeOrder.useMutation();
  const syncCartMutation = trpc.cart.sync.useMutation();

  const validateCoupon = trpc.coupon.validate.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setCouponCode('');
      toast.success(`Coupon applied! ${data.description}`);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const netTotal = Math.max(0, total() - (appliedCoupon?.discount ?? 0));

  // ─── Address Form ─────────────────────────────────────────────────────────
  const handleAddNewAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addAddressMutation.mutate({
      label:     fd.get('label')    as string,
      line1:     fd.get('line1')    as string,
      city:      fd.get('city')     as string,
      state:     fd.get('state')    as string,
      pincode:   fd.get('pincode')  as string,
      isDefault: fd.get('isDefault') === 'on',
    });
    e.currentTarget.reset();
  };

  // ─── Place order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address.'); return; }
    if (items.length === 0) { toast.error('Your cart is empty.'); return; }
    setIsPlacingOrder(true);
    try {
      // Always sync local cart → server before placing order
      await syncCartMutation.mutateAsync(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );

      const result = await placeOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        notes,
        paymentMethod,
      });

      if (paymentMethod === 'MANUAL_UPI') {
        clearCart();
        toast.success('Order placed! Proceeding to payment...');
        router.push(`/orders/${result.orderIds[0]}/payment`);
      } else {
        clearCart();
        setPlacedOrderIds(result.orderIds);
        toast.success('🎉 Order placed! Pay on delivery.');
        router.push(`/orders/${result.orderIds[0]}?success=true`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── Done Screen ──────────────────────────────────────────────────────────
  if (paymentStep === 'DONE') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-sm mx-auto">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-bounce">
            <CheckCircle size={48} className="text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-white tracking-tighter">Payment Done!</h1>
            <p className="text-white/50 font-medium leading-relaxed">Your order is confirmed and the vendor has been notified. Get ready for fast delivery!</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/orders/${placedOrderIds[0]}?success=true`)}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
            >
              Track My Order <ArrowRight size={18} />
            </button>
            <button onClick={() => router.push('/')} className="w-full py-3 border border-white/10 text-white/50 font-bold rounded-2xl hover:border-white/20 transition-all text-sm">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }


  // ─── Main Checkout Screen ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Page Heading */}
        <div className="flex flex-col gap-1 mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-none">Checkout</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Review your order & choose payment</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Address Selector */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Home size={18} className="text-orange-500" /> Delivery Address
                </h2>
                <button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition-all border border-gray-100"
                >
                  <Plus size={18} className={`transition-transform duration-300 ${showNewAddressForm ? 'rotate-45' : ''}`} />
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                  <Loader2 size={14} className="animate-spin" /> Fetching your locations...
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses?.map(address => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`group p-5 rounded-2xl cursor-pointer transition-all border-2 relative ${
                        selectedAddressId === address.id
                          ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {selectedAddressId === address.id && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle size={18} className="text-orange-500 fill-orange-500 text-white" />
                        </div>
                      )}
                      <Home className={`w-5 h-5 mb-3 transition-colors ${selectedAddressId === address.id ? 'text-orange-600' : 'text-gray-300 group-hover:text-gray-500'}`} />
                      <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{address.label}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">{address.line1}, {address.city}</p>
                      {address.isDefault && (
                        <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-[0.2em] bg-gray-900 text-white px-2 py-0.5 rounded-full">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showNewAddressForm && (
                <form onSubmit={handleAddNewAddress} className="mt-6 space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-400">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input name="label" placeholder="Label (e.g. Home, Work)" className="input h-12 text-sm" required />
                    <input name="line1" placeholder="Detailed address" className="input h-12 text-sm" required />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input name="city" placeholder="City" className="input h-12 text-sm" required />
                    <input name="state" placeholder="State" className="input h-12 text-sm" required />
                    <input name="pincode" placeholder="Pincode" className="input h-12 text-sm" required />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="isDefault" id="isDefault" className="h-4 w-4 text-orange-600 rounded" />
                    <label htmlFor="isDefault" className="text-xs font-bold text-gray-700">Set as default</label>
                    <button type="submit" className="btn-primary ml-auto h-11 px-6 text-sm" disabled={addAddressMutation.isPending}>
                      {addAddressMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Payment Method ──────────────────────────────────────── */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-orange-500" /> Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {/* Manual UPI (Free) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MANUAL_UPI')}
                  className={`relative group flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'MANUAL_UPI'
                      ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${
                      paymentMethod === 'MANUAL_UPI' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-gray-100'
                    }`}>
                      <CreditCard size={20} className={paymentMethod === 'MANUAL_UPI' ? 'text-white' : 'text-gray-400'} />
                    </div>
                    {paymentMethod === 'MANUAL_UPI' && (
                      <div className="w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center border-orange-500 bg-orange-500">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className={`font-black text-base ${paymentMethod === 'MANUAL_UPI' ? 'text-orange-900' : 'text-gray-400'}`}>Direct UPI Transfer (Zero Cost)</p>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">Pay via any UPI app and enter Transaction ID. Free for you!</p>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`relative group flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${
                      paymentMethod === 'COD' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-gray-100'
                    }`}>
                      <Banknote size={20} className={paymentMethod === 'COD' ? 'text-white' : 'text-gray-400'} />
                    </div>
                    {paymentMethod === 'COD' && (
                      <div className="w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center border-orange-500 bg-orange-500">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <p className={`font-black text-base ${paymentMethod === 'COD' ? 'text-orange-900' : 'text-gray-400'}`}>Cash on Delivery</p>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">Pay in cash when your order arrives at your doorstep.</p>

                  <div className="mt-3 flex items-center gap-1.5">
                    <AlertCircle size={11} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">₹10 extra COD fee</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <Tag size={18} className="text-orange-500" /> Promo Code
              </h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <div>
                      <span className="font-black text-emerald-800 font-mono text-sm uppercase">{appliedCoupon.code}</span>
                      <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{appliedCoupon.description}</span>
                    </div>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-600 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER PROMO CODE"
                    className="flex-1 h-12 px-5 bg-gray-50 font-mono font-bold tracking-widest text-sm rounded-2xl border-2 border-transparent focus:border-orange-300 focus:bg-white outline-none transition-all uppercase placeholder:opacity-40"
                    onKeyDown={e => { if (e.key === 'Enter' && couponCode) validateCoupon.mutate({ code: couponCode, cartTotal: total() }); }}
                  />
                  <button
                    onClick={() => couponCode && validateCoupon.mutate({ code: couponCode, cartTotal: total() })}
                    disabled={validateCoupon.isPending || !couponCode}
                    className="px-6 h-12 bg-gray-900 hover:bg-black disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
                  >
                    {validateCoupon.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-black text-gray-900 mb-4">Special Instructions</h2>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any landmarks or special notes for the delivery partner?"
                className="input w-full min-h-[100px] pt-4 resize-none text-sm"
              />
            </div>
          </div>

          {/* ── Right Column — Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sticky top-[5.5rem] space-y-6">
              {/* Order items */}
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 max-h-52 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-orange-50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-xs truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-black text-gray-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="border-t border-dashed border-gray-100 pt-5 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span><span>₹{total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Delivery</span><span className="text-emerald-600">Free</span>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="flex justify-between text-xs font-bold text-amber-500 uppercase tracking-widest">
                    <span>COD Fee</span><span>+₹10.00</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Tag size={11} /> {appliedCoupon.code}</span>
                    <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-3 border-t-2 border-dashed border-gray-100">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
                    ₹{(netTotal + (paymentMethod === 'COD' ? 10 : 0)).toFixed(2)}
                  </span>
                </div>
              </div>



              {/* Confirm CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || items.length === 0}
                className="w-full h-14 font-black text-white text-sm uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 bg-gray-900 shadow-gray-900/10"
              >
                {isPlacingOrder
                  ? <Loader2 className="animate-spin" size={20} />
                  : <>{paymentMethod === 'COD' ? <Banknote size={18} /> : <CreditCard size={18} />} {paymentMethod === 'COD' ? 'Place COD Order' : 'Place Order & Pay UPI'} <ChevronRight size={16} /></>
                }
              </button>

              <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-orange-400" /> Secured by Deeshora · 256-bit SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}