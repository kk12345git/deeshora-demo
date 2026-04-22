// src/app/(customer)/checkout/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import {
  Home, Plus, Loader2, Tag, X, CheckCircle, ShieldCheck,
  Smartphone, Banknote, ChevronRight, Copy, Check,
  ArrowRight, Sparkles, CreditCard, Clock, Star,
  Zap, AlertCircle, ExternalLink,
} from 'lucide-react';

// ─── UPI VPA — update this to the merchant's real VPA ────────────────────────
const MERCHANT_UPI_ID = "deeshware15@okicici";
const MERCHANT_NAME   = "Deeshora";

// ─── Build UPI deeplink / QR string ──────────────────────────────────────────
function buildUpiUrl(amount: number, orderId: string) {
  const params = new URLSearchParams({
    pa: MERCHANT_UPI_ID,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Deeshora Order ${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

type PaymentStep = 'SELECT' | 'UPI_SCAN' | 'UPI_CONFIRM' | 'DONE';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: addresses, isLoading: isLoadingAddresses } = trpc.vendor.myAddresses.useQuery();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('SELECT');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | { id: string; code: string; discount: number; description: string }>(null);
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([]);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [isConfirmingUpi, setIsConfirmingUpi] = useState(false);

  const addAddressMutation = trpc.vendor.addAddress.useMutation({
    onSuccess: () => {
      utils.vendor.myAddresses.invalidate();
      toast.success('Address added!');
      setShowNewAddressForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const placeOrderMutation = trpc.order.placeOrder.useMutation();
  const confirmUpiMutation = trpc.order.confirmUpiPayment.useMutation();
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
  const upiUrl = placedOrderIds[0] ? buildUpiUrl(netTotal, placedOrderIds[0]) : '';

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

      clearCart();
      setPlacedOrderIds(result.orderIds);

      if (paymentMethod === 'COD') {
        toast.success('🎉 Order placed! Pay on delivery.');
        router.push(`/orders/${result.orderIds[0]}?success=true`);
      } else {
        // UPI — show QR screen
        setPaymentStep('UPI_SCAN');
        toast.success('Order created! Scan to pay.', { icon: '📱' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── Confirm UPI paid ─────────────────────────────────────────────────────
  const handleConfirmUpi = useCallback(async () => {
    if (!placedOrderIds[0]) return;
    setIsConfirmingUpi(true);
    try {
      await confirmUpiMutation.mutateAsync({
        orderId: placedOrderIds[0],
        utrNumber: utrInput.trim() || undefined,
      });
      setPaymentStep('DONE');
      toast.success('✅ Payment confirmed! Your order is live.', { duration: 4000 });
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm payment.');
    } finally {
      setIsConfirmingUpi(false);
    }
  }, [placedOrderIds, utrInput, confirmUpiMutation]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(MERCHANT_UPI_ID);
    setCopiedUpi(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // ─── UPI Scan Screen ───────────────────────────────────────────────────────
  if (paymentStep === 'UPI_SCAN') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[11px] font-black uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Secure UPI Payment
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Scan & Pay</h1>
            <p className="text-white/50 text-sm font-medium">Open your UPI app and scan the QR code below</p>
          </div>

          {/* QR Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-black/40 space-y-6 relative overflow-hidden">
            {/* subtle background glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />

            {/* Amount Badge */}
            <div className="text-center relative z-10">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Amount to Pay</p>
              <p className="text-5xl font-black text-gray-900 tracking-tighter">₹{netTotal.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1 font-bold">Order #{placedOrderIds[0]?.slice(-8).toUpperCase()}</p>
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-center relative z-10">
              <div className="p-4 bg-white rounded-[1.5rem] border-4 border-orange-500 shadow-xl shadow-orange-500/15 relative">
                <QRCodeSVG
                  value={upiUrl}
                  size={220}
                  level="H"
                  includeMargin={false}
                  fgColor="#111827"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: "/logo.jpg",
                    x: undefined,
                    y: undefined,
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
                {/* Corner decorations */}
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5 ${i < 2 ? 'border-t-2' : 'border-b-2'} ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'} border-orange-500 rounded-sm`} />
                ))}
              </div>
            </div>

            {/* Supported UPI Apps */}
            <div className="flex items-center justify-center gap-3 relative z-10">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
                <span key={app} className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{app}</span>
              ))}
            </div>

            {/* UPI ID row */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 relative z-10">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI ID</p>
                <p className="font-black text-gray-900 font-mono text-sm mt-0.5 truncate">{MERCHANT_UPI_ID}</p>
              </div>
              <button onClick={copyUpiId} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copiedUpi ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}>
                {copiedUpi ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Deep-link button (mobile) */}
            <a
              href={upiUrl}
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-sm rounded-[1.25rem] shadow-xl shadow-orange-500/30 hover:-translate-y-0.5 transition-all relative z-10"
            >
              <Smartphone size={18} />
              Open UPI App Directly
              <ExternalLink size={14} className="opacity-60" />
            </a>
          </div>

          {/* Confirm Payment Section */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <h3 className="text-sm font-black text-white">After paying, confirm here</h3>
            </div>
            <p className="text-white/40 text-xs font-medium leading-relaxed">
              Once your UPI payment is successful, enter the UTR/Transaction ID (optional) and tap confirm.
            </p>
            <input
              type="text"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value)}
              placeholder="UTR / Transaction ID (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-orange-500/50 placeholder:text-white/20"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPaymentStep('SELECT');
                  setPaymentMethod('COD');
                }}
                className="py-3 rounded-xl border border-white/10 text-white/50 text-xs font-black hover:border-white/20 hover:text-white/70 transition-all"
              >
                Switch to COD
              </button>
              <button
                onClick={handleConfirmUpi}
                disabled={isConfirmingUpi}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isConfirmingUpi ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={15} /> I've Paid</>}
              </button>
            </div>
          </div>

          {/* Timer hint */}
          <div className="flex items-center gap-2 justify-center text-white/30 text-xs font-bold">
            <Clock size={13} />
            <span>Complete payment within 10 minutes to keep your order active</span>
          </div>
        </div>
      </div>
    );
  }

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`relative group flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-orange-500 bg-orange-50/40 shadow-xl shadow-orange-500/10'
                      : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  {/* Recommended badge */}
                  <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20">
                    <Star size={9} className="text-white fill-white" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Recommended</span>
                  </div>

                  <div className="flex items-center justify-between mb-3 mt-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${paymentMethod === 'UPI' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-gray-100 shadow-gray-100/10 group-hover:bg-orange-100'}`}>
                      <Smartphone size={20} className={paymentMethod === 'UPI' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                      {paymentMethod === 'UPI' && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>

                  <p className="font-black text-gray-900 text-base">UPI / QR Pay</p>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">GPay, PhonePe, Paytm, BHIM &amp; all UPI apps. Scan &amp; pay instantly.</p>

                  <div className="mt-3 flex items-center gap-1.5">
                    <Zap size={11} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Instant confirmation</span>
                  </div>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`relative group flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-gray-900 bg-gray-900/5 shadow-xl shadow-gray-900/5'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${paymentMethod === 'COD' ? 'bg-gray-900 shadow-gray-900/20' : 'bg-gray-100'}`}>
                      <Banknote size={20} className={paymentMethod === 'COD' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${paymentMethod === 'COD' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                      {paymentMethod === 'COD' && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>

                  <p className="font-black text-gray-900 text-base">Cash on Delivery</p>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">Pay in cash when your order arrives at your doorstep.</p>

                  <div className="mt-3 flex items-center gap-1.5">
                    <AlertCircle size={11} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">₹10 extra COD fee</span>
                  </div>
                </button>
              </div>

              {/* UPI info strip */}
              {paymentMethod === 'UPI' && (
                <div className="mt-4 flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-orange-900">Paying to: <span className="font-mono">{MERCHANT_UPI_ID}</span></p>
                    <p className="text-[10px] text-orange-700/60 font-medium mt-0.5">A QR code will appear after you place the order</p>
                  </div>
                </div>
              )}
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

              {/* Payment indicator */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${paymentMethod === 'UPI' ? 'border-orange-100 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
                {paymentMethod === 'UPI'
                  ? <><Smartphone size={16} className="text-orange-500 flex-shrink-0" /><span className="text-xs font-black text-orange-800">Paying via UPI — QR code appears next</span></>
                  : <><Banknote size={16} className="text-gray-500 flex-shrink-0" /><span className="text-xs font-black text-gray-600">Paying cash on delivery</span></>
                }
              </div>

              {/* Confirm CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || items.length === 0}
                className={`w-full h-14 font-black text-white text-sm uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 ${
                  paymentMethod === 'UPI'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/20'
                    : 'bg-gray-900 shadow-gray-900/10'
                }`}
              >
                {isPlacingOrder
                  ? <Loader2 className="animate-spin" size={20} />
                  : paymentMethod === 'UPI'
                    ? <><Smartphone size={18} /> Pay ₹{netTotal.toFixed(2)} via UPI <ChevronRight size={16} /></>
                    : <><Banknote size={18} /> Place COD Order <ChevronRight size={16} /></>
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