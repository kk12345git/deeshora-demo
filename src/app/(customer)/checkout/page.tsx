// src/app/(customer)/checkout/page.tsx
"use client";


import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Home, Plus, Loader2, Tag, X, CheckCircle, ShieldCheck } from 'lucide-react';


declare global {
  interface Window {
    Razorpay: any;
  }
}


export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const utils = trpc.useUtils();


  const { data: addresses, isLoading: isLoadingAddresses } = trpc.vendor.myAddresses.useQuery();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | { id: string; code: string; discount: number; description: string }>(null);


  const addAddressMutation = trpc.vendor.addAddress.useMutation({
    onSuccess: () => {
      utils.vendor.myAddresses.invalidate();
      toast.success('Address added successfully!');
      setShowNewAddressForm(false);
    },
    onError: (error) => toast.error(error.message),
  });


  const createOrderMutation = trpc.order.createPaymentOrder.useMutation();
  const verifyPaymentMutation = trpc.order.verifyPayment.useMutation();
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
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);


  const handleAddNewAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addAddressMutation.mutate({
      label: formData.get('label') as string,
      line1: formData.get('line1') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      isDefault: formData.get('isDefault') === 'on',
    });
    e.currentTarget.reset();
  };


  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };


  const handlePayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address.');
      return;
    }
    setIsPlacingOrder(true);


    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      setIsPlacingOrder(false);
      return;
    }


    try {
      const paymentOrder = await createOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        notes,
      });


      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: 'INR',
        name: 'Deeshora',
        description: 'Order Payment',
        order_id: paymentOrder.razorpayOrderId,
        handler: async function (response: any) {
          const verificationResult = await verifyPaymentMutation.mutateAsync({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderIds: paymentOrder.orderIds,
          });


          if (verificationResult.success) {
            toast.success('Payment successful! Your order is confirmed.');
            clearCart();
            router.push(`/orders/${verificationResult.orderIds[0]}?success=true`);
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          // You can prefill user details here
        },
        notes: {
          address: 'Deeshora Corporate Office',
        },
        theme: {
          color: '#f97316',
        },
      };


      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      paymentObject.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.');
        console.error(response.error);
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-10">
           <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tighter leading-none uppercase italic">Checkout</h1>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Complete your premium commerce experience</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Address Selector */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-orange-500/30 decoration-8 underline-offset-[-2px]">Delivery Address</h2>
                <button 
                   onClick={() => setShowNewAddressForm(!showNewAddressForm)} 
                   className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition-all border border-gray-100"
                >
                  <Plus size={20} className={`transition-transform duration-300 ${showNewAddressForm ? 'rotate-45' : ''}`} />
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="flex items-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                   <Loader2 size={16} className="animate-spin" /> Fetching your locations...
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses?.map(address => (
                    <div 
                      key={address.id} 
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`group p-6 rounded-[2rem] cursor-pointer transition-all border-2 relative overflow-hidden ${
                        selectedAddressId === address.id 
                        ? 'border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-500/5' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {selectedAddressId === address.id && (
                        <div className="absolute top-4 right-4 text-orange-600">
                           <CheckCircle size={20} className="fill-current text-white bg-orange-500 rounded-full" />
                        </div>
                      )}
                      <Home className={`w-6 h-6 mb-4 transition-colors ${selectedAddressId === address.id ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <div className="space-y-1">
                        <p className="font-black text-gray-900 uppercase tracking-tight leading-tight">{address.label}</p>
                        <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest truncate">{address.line1}, {address.city}</p>
                        {address.isDefault && (
                          <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-[0.2em] bg-gray-900 text-white px-3 py-1 rounded-full">Primary</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showNewAddressForm && (
                <form onSubmit={handleAddNewAddress} className="mt-10 space-y-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input name="label" placeholder="LABEL (E.G. HOME, WORK)" className="input h-14" required />
                    <input name="line1" placeholder="DETAILED ADDRESS" className="input h-14" required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input name="city" placeholder="CITY" className="input h-14" required />
                    <input name="state" placeholder="STATE" className="input h-14" required />
                    <input name="pincode" placeholder="PINCODE" className="input h-14" required />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="isDefault" id="isDefault" className="h-5 w-5 text-orange-600 rounded-lg border-gray-300 focus:ring-orange-500" />
                    <label htmlFor="isDefault" className="text-xs font-black text-gray-700 uppercase tracking-widest">Set as default</label>
                    <button type="submit" className="btn-primary ml-auto h-12" disabled={addAddressMutation.isPending}>
                      {addAddressMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Save Location'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Coupon Code */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-xl p-8 md:p-10">
              <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase italic tracking-tight">
                 <Tag size={20} className="text-orange-500" /> Promotional Rewards
              </h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-3xl px-6 py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-500" />
                    <div className="flex flex-col">
                       <span className="font-black text-emerald-800 font-mono tracking-widest text-sm uppercase">{appliedCoupon.code}</span>
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{appliedCoupon.description}</span>
                    </div>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="w-10 h-10 rounded-xl bg-emerald-100/50 hover:bg-emerald-200 flex items-center justify-center text-emerald-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE (E.G. WELCOME100)"
                    className="flex-1 h-14 px-6 bg-gray-50/50 backdrop-blur-sm font-mono font-bold tracking-[0.2em] text-sm rounded-2xl border-2 border-transparent focus:border-orange-500/30 focus:bg-white outline-none transition-all uppercase placeholder:opacity-50"
                    onKeyDown={e => { if (e.key === 'Enter' && couponCode) validateCoupon.mutate({ code: couponCode, cartTotal: total() }); }}
                  />
                  <button
                    onClick={() => couponCode && validateCoupon.mutate({ code: couponCode, cartTotal: total() })}
                    disabled={validateCoupon.isPending || !couponCode}
                    className="px-8 h-14 bg-gray-950 hover:bg-black disabled:opacity-40 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-black/10 flex items-center gap-2"
                  >
                    {validateCoupon.isPending ? <Loader2 size={14} className="animate-spin" /> : 'REDEEM'}
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Notes */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-xl p-8 md:p-10">
              <h2 className="text-lg font-black text-gray-900 mb-6 uppercase italic tracking-tight">Special Instructions</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any secret landmarks or instructions for the local hero?"
                className="input w-full min-h-[120px] pt-4 resize-none"
              />
            </div>
          </div>


          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl p-8 sticky top-24 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
              
              <h2 className="text-2xl font-black text-gray-950 mb-8 uppercase italic tracking-tight relative z-10">Order Bill</h2>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-4 no-scrollbar relative z-10">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight w-40 truncate leading-none mb-1">{item.name}</span>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-black text-sm text-gray-950 tracking-tighter">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4 relative z-10">
                <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Gross Value</span>
                  <span className="text-gray-600">₹{total().toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Tag size={12} /> {appliedCoupon.code}</span>
                    <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t-2 border-dashed border-gray-100">
                  <span className="text-xs font-black text-gray-950 uppercase tracking-[0.2em] mb-1">Total Payable</span>
                  <span className="text-4xl font-black text-gray-950 tracking-tighter leading-none">₹{Math.max(0, total() - (appliedCoupon?.discount ?? 0)).toFixed(2)}</span>
                </div>
              </div>

              {/* Secure Bank Badge */}
              <div className="mt-10 p-5 bg-gradient-to-br from-orange-500/5 to-transparent rounded-[2rem] border border-orange-500/10 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-10">
                   <ShieldCheck size={40} className="text-orange-500" />
                </div>
                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mb-3">Official Escrow Partner</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-400 uppercase">Bank</span>
                    <span className="font-black text-gray-900 uppercase italic">BOB (India)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-400 uppercase">A/C No</span>
                    <span className="font-black text-orange-600 tabular-nums">**** **** 1534</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isPlacingOrder || items.length === 0}
                className="btn-primary w-full h-16 rounded-3xl mt-10 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 active:scale-95"
              >
                {isPlacingOrder ? <Loader2 className="animate-spin mx-auto" /> : `INITIATE PAYMENT`}
              </button>

              <p className="mt-6 text-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                 <ShieldCheck size={12} /> Powering secure local commerce
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}