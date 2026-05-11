"use client";

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { Loader2, ArrowRight, ShieldCheck, CheckCircle, CreditCard, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function OrderPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: order, isLoading, error } = trpc.order.byId.useQuery({ id: orderId });
  const submitUtr = trpc.order.submitUtr.useMutation({
    onSuccess: () => {
      toast.success('UTR Submitted! Verification pending.');
      router.push(`/orders/${orderId}?success=true`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [showQR, setShowQR] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="font-bold text-gray-900 text-lg">Order not found.</p>
        <button onClick={() => router.push('/')} className="bg-gray-900 text-white px-6 py-3 rounded-xl">
          Return Home
        </button>
      </div>
    );
  }

  // Already paid? Go to tracking
  if (order.paymentStatus === 'PAID') {
    router.push(`/orders/${order.id}`);
    return null;
  }

  const vendorUpiId = order.vendor.upiId;
  const vendorUpiQr = order.vendor.upiQrCode;
  
  // Construct standard UPI URI
  const upiUrl = vendorUpiId 
    ? `upi://pay?pa=${vendorUpiId}&pn=${encodeURIComponent(order.vendor.shopName)}&am=${order.total.toFixed(2)}&tr=${order.id}&cu=INR`
    : '';

  // Use vendor QR if available, otherwise fallback to generating one using a generic API
  const qrUrl = vendorUpiQr || (upiUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}` : null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Complete Payment</h1>
          <p className="text-gray-500 font-medium text-sm mt-2">Pay directly to <span className="text-gray-900 font-bold">{order.vendor.shopName}</span></p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4 border-b border-dashed border-gray-100 pb-4">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Order ID</span>
            <span className="text-gray-900 font-black text-sm">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-900 font-black uppercase tracking-widest text-sm">Amount to Pay</span>
            <span className="text-4xl font-black text-orange-500 tracking-tighter">₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="text-emerald-500" size={20} /> Choose Method
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setShowQR(false)}
              className={`p-4 rounded-2xl border-2 transition-all font-black text-sm flex flex-col items-center justify-center gap-2 ${!showQR ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
            >
              <Image src="/images/upi.png" alt="UPI" width={32} height={32} className="opacity-80" />
              Pay via App
            </button>
            <button
              onClick={() => setShowQR(true)}
              className={`p-4 rounded-2xl border-2 transition-all font-black text-sm flex flex-col items-center justify-center gap-2 ${showQR ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
            >
              <QrCode size={32} className={showQR ? "text-emerald-500" : "text-gray-400"} />
              Scan QR Code
            </button>
          </div>

          {!showQR ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
              <a 
                href={upiUrl}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                Open UPI App <ArrowRight size={18} />
              </a>
              <p className="text-xs font-bold text-gray-400">Clicking above will open GPay, PhonePe, Paytm etc.</p>
            </div>
          ) : (
            <div className="text-center animate-in fade-in zoom-in-95">
              <div className="bg-gray-50 p-4 rounded-3xl inline-block border border-gray-100 shadow-sm">
                {qrUrl ? (
                  <img src={qrUrl} alt="Vendor QR Code" className="w-48 h-48 rounded-2xl" />
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs text-center px-4">
                    Vendor has not set up UPI ID/QR.
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-gray-400 mt-4">Scan this code using any UPI app to pay <br/><span className="text-gray-900 font-black">{order.vendor.shopName}</span></p>
            </div>
          )}
        </div>

        {/* UTR Submission */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-gray-900 mb-2">Confirm Payment</h2>
          <p className="text-xs font-bold text-gray-400 mb-4 leading-relaxed">After paying, enter the 12-digit UTR / Transaction ID from your app below to confirm your order.</p>
          
          <input
            type="text"
            placeholder="Enter 12-digit UTR Number"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
            className="w-full h-14 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all rounded-2xl px-5 font-mono font-black text-center tracking-widest text-gray-900 placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal mb-4 outline-none"
            maxLength={12}
          />

          <button
            onClick={() => {
              if (utrNumber.length < 12) {
                toast.error('Please enter a valid 12-digit UTR number');
                return;
              }
              submitUtr.mutate({ orderId: order.id, utrNumber });
            }}
            disabled={utrNumber.length < 12 || submitUtr.isPending}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {submitUtr.isPending ? <Loader2 className="animate-spin" /> : <>Submit & Confirm <CheckCircle size={20} className="text-emerald-400" /></>}
          </button>
        </div>

        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-8">
          <ShieldCheck size={14} className="text-emerald-500" /> Direct-to-Vendor Secure Payment
        </p>
      </div>
    </div>
  );
}
