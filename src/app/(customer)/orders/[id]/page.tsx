// src/app/(customer)/orders/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import Image from 'next/image';
import { Wifi, WifiOff, Phone, FileText, ChevronLeft, Star, Send, Loader2, CheckCircle, Package, CookingPot, Bike, Home, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OrderStatus } from '@prisma/client';
import toast from 'react-hot-toast';


// ─── Animated delivery progress ───────────────────────────────────────────────
const STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: 'PENDING',          label: 'Placed',       emoji: '📋' },
  { status: 'CONFIRMED',        label: 'Confirmed',    emoji: '✅' },
  { status: 'PREPARING',        label: 'Preparing',    emoji: '🍳' },
  { status: 'READY',            label: 'Ready',        emoji: '📦' },
  { status: 'OUT_FOR_DELIVERY', label: 'On the Way',   emoji: '🛵' },
  { status: 'DELIVERED',        label: 'Delivered',    emoji: '🏠' },
];

function DeliveryProgress({ status }: { status: OrderStatus }) {
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const currentIdx = STEPS.findIndex(s => s.status === status);
  const pct = currentIdx >= 0 ? (currentIdx / (STEPS.length - 1)) * 100 : 0;

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-3xl">❌</div>
        <p className="font-black text-red-600 text-lg">Order {status === 'REFUNDED' ? 'Refunded' : 'Cancelled'}</p>
        <p className="text-gray-400 text-sm">This order was {status.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Progress track */}
      <div className="relative mb-8">
        <div className="absolute left-0 right-0 top-5 h-1 bg-gray-100 rounded-full" />
        <div
          className="absolute left-0 top-5 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div className="flex justify-between relative">
          {STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.status} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm
                  ${done
                    ? 'bg-orange-500 shadow-orange-200 scale-110'
                    : 'bg-gray-100'
                  }
                  ${active ? 'ring-4 ring-orange-100 animate-pulse' : ''}
                `}>
                  {step.emoji}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wide text-center leading-tight
                  ${done ? 'text-orange-500' : 'text-gray-300'}
                `}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active step message */}
      {currentIdx >= 0 && (
        <div className="flex items-center justify-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mt-2">
          <span className="text-xl">{STEPS[currentIdx].emoji}</span>
          <div>
            <p className="font-black text-orange-700 text-sm">{STEPS[currentIdx].label}</p>
            <p className="text-xs text-orange-500">
              {currentIdx < STEPS.length - 1
                ? `Next: ${STEPS[currentIdx + 1].label} ${STEPS[currentIdx + 1].emoji}`
                : 'Your order has arrived! 🎉'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Star Rating input ─────────────────────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={`transition-colors ${n <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
          />
        </button>
      ))}
    </div>
  );
}


// ─── Review form widget ────────────────────────────────────────────────────────
function ReviewForm({ productId, productName, onDone }: { productId: string; productName: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const addReview = trpc.product.addReview.useMutation({
    onSuccess: () => {
      toast.success('Review submitted! Thank you 🌟');
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      <div>
        <p className="font-black text-gray-800 text-sm">Rate: <span className="text-orange-500">{productName}</span></p>
        <p className="text-xs text-gray-400 mt-0.5">Your honest opinion helps future buyers</p>
      </div>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="What did you love? Any suggestions? (optional)"
        rows={2}
        className="w-full px-4 py-3 text-sm bg-white border-2 border-transparent focus:border-orange-400 rounded-xl outline-none resize-none font-medium transition-all"
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!rating) { toast.error('Please select a star rating'); return; }
            addReview.mutate({ productId, rating, comment: comment.trim() || undefined });
          }}
          disabled={addReview.isPending || !rating}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
        >
          {addReview.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Submit Review
        </button>
        <button onClick={onDone} className="text-xs font-bold text-gray-400 hover:text-gray-600 px-3 py-2.5">
          Cancel
        </button>
      </div>
    </div>
  );
}


// ─── Main page ─────────────────────────────────────────────────────────────────
export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: order, isLoading, error } = trpc.order.byId.useQuery({ id: orderId });
  const { updates, currentStatus: liveStatus, isConnected } = useOrderTracking(orderId);

  const [displayStatus, setDisplayStatus] = useState<OrderStatus | null>(null);
  const [reviewingProductId, setReviewingProductId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  
  // WhatsApp Automation State
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { data: config } = trpc.admin.getConfig.useQuery();

  useEffect(() => {
    if (liveStatus) setDisplayStatus(liveStatus);
    else if (order) setDisplayStatus(order.status);
  }, [liveStatus, order]);

  // Handle WhatsApp Auto-Redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isSuccess = searchParams.get('success') === 'true';

    if (isSuccess && order && !isRedirecting) {
      setIsRedirecting(true);
      
      const handleWhatsAppRedirect = async () => {
        const businessNumber = config?.find(c => c.key === 'business_whatsapp')?.value || '918939318865';
        let locationMsg = "Location not shared.";

        try {
          // Request location
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          const { latitude, longitude } = position.coords;
          locationMsg = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } catch (err) {
          console.warn("Location access denied or timed out");
        }

        const message = `Hi Deeshora! 🌟\n\nI just placed an order!\nOrder ID: #${order.id.slice(-8).toUpperCase()}\nTotal: ₹${order.total.toFixed(0)}\n\nMy Delivery Location:\n${locationMsg}\n\nPlease confirm my order! Thank you! 🙏`;
        
        window.location.href = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
      };

      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-bold text-sm">Order Confirmed! 🎉</p>
          <p className="text-xs">Redirecting to WhatsApp to share your location for faster delivery...</p>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              handleWhatsAppRedirect();
            }}
            className="bg-orange-500 text-white text-xs font-bold py-1.5 rounded-lg mt-1"
          >
            Redirect Now
          </button>
        </div>
      ), { duration: 6000 });

      // Auto-trigger after a short delay to allow toast to show
      setTimeout(handleWhatsAppRedirect, 2000);
    }
  }, [order, config, isRedirecting]);

  if (isLoading) return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tracking your order...</p>
    </div>
  );
  if (error || !order) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <p className="font-bold text-red-500">{error?.message ?? "We couldn't find that order."}</p>
      <button onClick={() => router.back()} className="btn-primary mt-4">← Go Back</button>
    </div>
  );

  const allTimelineEvents = [
    ...updates.map(u => ({ ...u, createdAt: u.timestamp })),
    ...order.timeline
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isDelivered = displayStatus === 'DELIVERED';

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Order Tracking</p>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">#{order.id.slice(-8).toUpperCase()}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
            isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'
          }`}>
            {isConnected
              ? <><Wifi size={11} /><span className="hidden sm:inline">Live</span><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /></>
              : <><WifiOff size={11} /><span className="hidden sm:inline">Offline</span></>
            }
          </div>
          {order.paymentStatus === 'PAID' && (
            <Link
              href={`/orders/${orderId}/invoice`}
              className="flex items-center gap-1.5 text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full border border-orange-100 transition-colors"
            >
              <FileText size={11} /> Invoice
            </Link>
          )}
        </div>
      </div>

      {/* From shop */}
      <div className="flex items-center gap-2 mb-6 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
          🏪
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">From</p>
          <p className="font-black text-gray-900 text-sm truncate">{order.vendor.shopName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
          <p className="font-black text-gray-900 text-sm">₹{order.total.toFixed(0)}</p>
        </div>
        <OrderStatusBadge status={displayStatus ?? order.status} />
      </div>

      {/* Delivery progress */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/60 p-6 sm:p-8 mb-6">
        {displayStatus && <DeliveryProgress status={displayStatus} />}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column: timeline + items + reviews */}
        <div className="lg:col-span-2 space-y-5">
          {/* Timeline */}
          {allTimelineEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-1.5">
                <Clock size={11} /> Journey Timeline
              </h2>
              <div className="space-y-6">
                {allTimelineEvents.map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-gray-200'}`} />
                      {idx < allTimelineEvents.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className={`pb-4 ${idx < allTimelineEvents.length - 1 ? '' : ''}`}>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <OrderStatusBadge status={event.status} />
                        <span className="text-[10px] font-bold text-gray-300">
                          {new Date(event.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-700">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items + Review CTA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Items Ordered</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map(item => {
                const justReviewed = reviewedIds.has(item.productId ?? '');
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image
                          ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-sm leading-tight truncate">{item.name}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Qty {item.quantity} × ₹{(item.total / item.quantity).toFixed(0)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-gray-900">₹{item.total.toFixed(0)}</p>
                        {isDelivered && item.productId && !justReviewed && (
                          <button
                            onClick={() => setReviewingProductId(
                              reviewingProductId === item.productId ? null : item.productId!
                            )}
                            className="text-[10px] font-black text-amber-500 hover:text-amber-600 flex items-center gap-0.5 mt-1 ml-auto"
                          >
                            <Star size={10} fill="currentColor" /> Review
                          </button>
                        )}
                        {justReviewed && (
                          <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5 mt-1 ml-auto">
                            <CheckCircle size={10} /> Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Review form inline */}
                    {reviewingProductId === item.productId && (
                      <ReviewForm
                        productId={item.productId!}
                        productName={item.name}
                        onDone={() => {
                          setReviewingProductId(null);
                          setReviewedIds(prev => new Set(prev).add(item.productId!));
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total</span>
              <span className="text-xl font-black text-gray-900">₹{order.total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Delivering To</p>
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              {order.address.line1}
              {order.address.line2 && `, ${order.address.line2}`},<br />
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Payment</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">Status</span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-gray-600">Amount</span>
              <span className="font-black text-gray-900">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Call store */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg shadow-orange-500/30">
            <p className="text-xs font-black text-orange-200 uppercase tracking-widest mb-1 text-center">Trouble with order?</p>
            <p className="text-sm font-bold mb-4 text-center opacity-90">Reach out to the store directly.</p>
            <a
              href={`tel:${order.vendor.phone}`}
              className="flex items-center justify-center gap-2 bg-white text-orange-500 h-12 rounded-xl font-black text-sm shadow-md hover:scale-[1.02] transition-transform"
            >
              <Phone size={16} fill="currentColor" /> Call Store
            </a>
          </div>

          {/* Review nudge if delivered and not reviewed */}
          {isDelivered && order.items.some(i => i.productId && !reviewedIds.has(i.productId)) && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center space-y-3">
              <div className="text-2xl">⭐</div>
              <p className="font-black text-amber-800 text-sm">How was your order?</p>
              <p className="text-xs text-amber-600">Tap "Review" next to any item to leave your rating</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}