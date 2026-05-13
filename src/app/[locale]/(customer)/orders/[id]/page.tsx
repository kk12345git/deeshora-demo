// src/app/(customer)/orders/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import Image from 'next/image';
import { 
  Wifi, WifiOff, Phone, FileText, ChevronLeft, Star, Send, Loader2, 
  CheckCircle, Package, CookingPot, Bike, Home, Clock, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OrderStatus } from '@prisma/client';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/customer/OrderMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center text-gray-400 font-bold">Loading Map...</div>
});

// ─── Animated Vertical Delivery Progress ────────────────────────────────────────
const STEPS: { status: OrderStatus; label: string; emoji: string; description: string }[] = [
  { status: 'PENDING',          label: 'Order Placed',       emoji: '📋', description: 'We have received your order' },
  { status: 'CONFIRMED',        label: 'Order Confirmed',    emoji: '✅', description: 'Your order has been accepted' },
  { status: 'PREPARING',        label: 'Preparing',          emoji: '🍳', description: 'Your items are being packed/prepared' },
  { status: 'READY',            label: 'Ready for Pickup',   emoji: '📦', description: 'Waiting for delivery partner' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',   emoji: '🛵', description: 'Your order is on the way' },
  { status: 'DELIVERED',        label: 'Delivered',          emoji: '🏠', description: 'Enjoy your order!' },
];

function VerticalDeliveryProgress({ 
  status, 
  timelineEvents, 
  deliveryPartner 
}: { 
  status: OrderStatus; 
  timelineEvents: any[];
  deliveryPartner: any;
}) {
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const currentIdx = STEPS.findIndex(s => s.status === status);

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3 bg-red-50 rounded-2xl border border-red-100">
        <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-3xl">❌</div>
        <p className="font-black text-red-600 text-lg">Order {status === 'REFUNDED' ? 'Refunded' : 'Cancelled'}</p>
        <p className="text-red-500 text-sm font-medium">This order was {status.toLowerCase()} and will not be delivered.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
      <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8 flex items-center gap-2">
        <Clock size={16} className="text-brand-500" /> Order Tracking
      </h2>
      <div className="relative pl-4 space-y-8">
        {/* Vertical Line */}
        <div className="absolute left-[35px] top-4 bottom-8 w-[2px] bg-gray-100 rounded-full" />
        <div 
          className="absolute left-[35px] top-4 w-[2px] bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
          style={{ height: currentIdx >= 0 ? `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 32px)` : '0%' }}
        />

        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          
          const stepEvents = timelineEvents.filter(e => e.status === step.status);
          const latestEvent = stepEvents[0];

          return (
            <div key={step.status} className="relative z-10 flex gap-6">
              {/* Icon / Bullet */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all duration-500
                ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-400'}
                ${active ? 'ring-4 ring-emerald-100 animate-pulse' : ''}
              `}>
                {done ? <CheckCircle size={20} /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex justify-between items-start mb-1">
                  <p className={`font-black text-base ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {latestEvent && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {new Date(latestEvent.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                
                <p className={`text-sm ${done ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.description}
                </p>

                {stepEvents.length > 0 && done && (
                  <div className="mt-3 space-y-2">
                    {stepEvents.map((e, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{e.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {active && step.status === 'OUT_FOR_DELIVERY' && deliveryPartner && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Bike size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Delivery Partner</p>
                        <p className="text-sm font-black text-gray-900">{deliveryPartner.name}</p>
                      </div>
                    </div>
                    {deliveryPartner.phone && (
                      <a href={`tel:${deliveryPartner.phone}`} className="w-10 h-10 bg-white border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                        <Phone size={16} fill="currentColor" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4 mt-3 animate-in slide-in-from-top-2 duration-300">
      <div>
        <p className="font-black text-gray-800 text-sm">Rate: <span className="text-brand-500">{productName}</span></p>
        <p className="text-xs text-gray-400 mt-0.5">Your honest opinion helps future buyers</p>
      </div>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="What did you love? Any suggestions? (optional)"
        rows={2}
        className="w-full px-4 py-3 text-sm bg-white border-2 border-transparent focus:border-brand-400 rounded-xl outline-none resize-none font-medium transition-all shadow-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!rating) { toast.error('Please select a star rating'); return; }
            addReview.mutate({ productId, rating, comment: comment.trim() || undefined });
          }}
          disabled={addReview.isPending || !rating}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
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

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: order, isLoading, error } = trpc.order.byId.useQuery({ id: orderId });
  const { updates, currentStatus: liveStatus, deliveryPartner: livePartner, isConnected } = useOrderTracking(orderId);
  
  const [displayStatus, setDisplayStatus] = useState<OrderStatus | null>(null);
  const [reviewingProductId, setReviewingProductId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [isRedirecting, setIsRedirecting] = useState(false);

  const reorderMutation = trpc.order.reorder.useMutation({
    onSuccess: () => {
      toast.success('Items added to cart!');
      router.push('/cart');
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (liveStatus) setDisplayStatus(liveStatus);
    else if (order) setDisplayStatus(order.status);
  }, [liveStatus, order]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isSuccess = searchParams.get('success') === 'true';
    if (isSuccess && order && !isRedirecting) {
      setIsRedirecting(true);
      const handleWhatsAppRedirect = async () => {
        const businessNumber = '918939318865'; 
        let locationMsg = "Location not shared.";
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          const { latitude, longitude } = position.coords;
          locationMsg = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } catch (err) {
          console.warn("Location access denied or timed out");
        }
        const invoiceUrl = `${window.location.origin}/orders/${order.id}/invoice`;
        const message = `Hi Deeshora! 🌟\n\nI just placed an order!\nOrder ID: #${order.id.slice(-8).toUpperCase()}\nTotal: ₹${order.total.toFixed(0)}\n\n📄 View Invoice: ${invoiceUrl}\n\nMy Delivery Location:\n${locationMsg}\n\nPlease confirm my order! Thank you! 🙏`;
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
            className="bg-brand-500 text-white text-xs font-bold py-1.5 rounded-lg mt-1"
          >
            Redirect Now
          </button>
        </div>
      ), { duration: 6000 });
      setTimeout(handleWhatsAppRedirect, 2000);
    }
  }, [order, isRedirecting]);

  if (isLoading) return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Fetching Order Details...</p>
    </div>
  );

  if (error || !order) return (
    <div className="container mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
        <AlertCircle size={32} />
      </div>
      <p className="font-black text-gray-900 text-xl">{error?.message ?? "We couldn't find that order."}</p>
      <button onClick={() => router.back()} className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800">
        ← Return Home
      </button>
    </div>
  );

  const allTimelineEvents = [
    ...updates.map(u => ({ ...u, createdAt: u.timestamp })),
    ...order.timeline
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isDelivered = displayStatus === 'DELIVERED';
  const currentPartner = livePartner || order.deliveryPartner;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto max-w-2xl px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-base font-black text-gray-900 tracking-tight">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 ${
              isConnected ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'
            }`}>
              {isConnected ? <><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> Live Tracking</> : <><WifiOff size={10}/> Offline</>}
            </div>
          </div>
          <div className="w-10" /> 
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 text-lg">🏪</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sold by</p>
                <p className="text-sm font-black text-gray-900">Deeshora</p>
              </div>
            </div>
            {order.paymentStatus === 'PAID' && (
              <Link
                href={`/orders/${orderId}/invoice`}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg transition-colors"
              >
                <FileText size={12} /> Invoice
              </Link>
            )}
          </div>
          <div className="space-y-4">
            {order.items.map(item => {
              const justReviewed = reviewedIds.has(item.productId ?? '');
              return (
                <div key={item.id}>
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      {item.image
                        ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-300" /></div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900 text-base leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Quantity: {item.quantity}</p>
                      <p className="font-black text-gray-900 mt-1">₹{(item.total / item.quantity).toFixed(0)}</p>
                    </div>
                  </div>
                  
                  {isDelivered && item.productId && !justReviewed && (
                    <button
                      onClick={() => setReviewingProductId(reviewingProductId === item.productId ? null : item.productId!)}
                      className="w-full mt-3 py-2 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Star size={14} className="text-brand-500" /> Write a Review
                    </button>
                  )}
                  {justReviewed && (
                    <div className="w-full mt-3 py-2 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> Review Submitted
                    </div>
                  )}
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
          
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 uppercase">Order Total</span>
            <span className="text-xl font-black text-gray-900">₹{order.total.toFixed(0)}</span>
          </div>
        </div>

        {(displayStatus === 'OUT_FOR_DELIVERY' || displayStatus === 'READY') && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 animate-in fade-in zoom-in-95 duration-500">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <Home size={14} /> Live Delivery Map
            </h2>
            <OrderMap status={displayStatus} orderId={order.id} />
          </div>
        )}

        <div className="mb-4">
          <VerticalDeliveryProgress 
             status={displayStatus ?? order.status} 
             timelineEvents={allTimelineEvents} 
             deliveryPartner={currentPartner}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Delivery Address</p>
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              <span className="text-gray-900 font-black">{order.user.name}</span><br />
              {order.address.line1}<br />
              {order.address.line2 && <>{order.address.line2}<br /></>}
              {order.address.city}, {order.address.pincode}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Payment Details</p>
              <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{order.paymentMethod}</p>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl w-fit text-[10px] font-black uppercase tracking-widest ${
              order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              {order.paymentStatus === 'PAID' ? <CheckCircle size={12} /> : <Clock size={12} />}
              {order.paymentStatus}
            </div>
          </div>
        </div>

        <div className="mt-8">
           <button
             onClick={() => {
               reorderMutation.mutate({ orderId });
             }}
             disabled={reorderMutation.isPending}
             className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2 hover:bg-black transition-all"
           >
             {reorderMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CookingPot size={18} />}
             One-Click Reorder
           </button>
        </div>
      </div>
    </div>
  );
}
