'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useVendorNotifications } from '@/hooks/useOrderTracking';
import { OrderStatus } from '@prisma/client';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import { 
  Phone, MapPin, Loader2, Bell, ChevronDown, Package, Clock, 
  CheckCircle, Truck, ShoppingBag, XCircle, IndianRupee, RefreshCw, 
  FileText, Send, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getWhatsAppUrl, WHATSAPP_TEMPLATES, getUPILink } from '@/lib/whatsapp';

const STATUS_CONFIG: Record<OrderStatus | 'ALL', { label: string; color: string; next?: OrderStatus; nextLabel?: string }> = {
  ALL:              { label: 'All Orders',      color: 'gray' },
  PENDING:          { label: 'Pending',          color: 'amber',   next: 'CONFIRMED',       nextLabel: '✅ Accept Order' },
  CONFIRMED:        { label: 'Confirmed',        color: 'blue',    next: 'PREPARING',       nextLabel: '🍳 Start Preparing' },
  PREPARING:        { label: 'Preparing',        color: 'purple',  next: 'READY',           nextLabel: '✔️ Mark Ready' },
  READY:            { label: 'Ready',            color: 'indigo',  next: 'OUT_FOR_DELIVERY', nextLabel: '🚴 Out for Delivery' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'brand',   next: 'DELIVERED',       nextLabel: '🎉 Mark Delivered' },
  DELIVERED:        { label: 'Delivered',        color: 'emerald' },
  CANCELLED:        { label: 'Cancelled',        color: 'red' },
  REFUNDED:         { label: 'Refunded',         color: 'gray' },
};

const TABS: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState<'ENGLISH' | 'TAMIL'>('ENGLISH');

  const { data: vendorProfile } = trpc.vendor.myProfile.useQuery();
  const { data: config } = trpc.admin.getSettings.useQuery();

  const queryInput = activeTab === 'ALL' ? { limit: 50 } : { limit: 50, status: activeTab };
  const { data, isLoading, refetch } = trpc.order.vendorOrders.useQuery(queryInput);

  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: (res, vars) => {
      toast.success('Order status updated!');
      refetch();
      if (expandedId === vars.orderId) setExpandedId(null);
      
      // Automated WhatsApp Prompt for Confirmation
      if (vars.status === 'CONFIRMED' && res.userPhone) {
        const invoiceUrl = `${window.location.origin}/${language === 'ENGLISH' ? 'en' : 'ta'}/orders/${vars.orderId}/invoice`;
        const whatsappUrl = getWhatsAppUrl(
          res.userPhone, 
          WHATSAPP_TEMPLATES[language].CONFIRMATION_WITH_INVOICE(vars.orderId, res.shopName, invoiceUrl)
        );
        
        toast.custom((t) => (
          <div className={`bg-white rounded-2xl shadow-2xl p-4 border border-emerald-100 flex flex-col gap-3 min-w-[300px] ${t.visible ? 'animate-in fade-in zoom-in-95' : 'animate-out fade-out zoom-out-95'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Send size={18} />
              </div>
              <div>
                <p className="font-black text-sm text-gray-900 uppercase tracking-tight">Invoice Ready!</p>
                <p className="text-xs text-gray-500">Share with customer now?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  window.open(whatsappUrl, '_blank');
                  toast.dismiss(t.id);
                }}
                className="flex-1 bg-[#25D366] hover:bg-[#22c35e] text-white font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Phone size={14} fill="currentColor" /> Send WhatsApp
              </button>
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs rounded-xl transition-all"
              >
                Later
              </button>
            </div>
          </div>
        ), { duration: 10000, position: 'top-center' });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyPaymentMutation = trpc.order.verifyPayment.useMutation({
    onSuccess: () => {
      toast.success('Payment verified!');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Real-time notifications
  const { isConnected } = useVendorNotifications(vendorProfile?.id, (data: any) => {
    toast.custom((t) => (
      <div className={`flex items-center gap-3 bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl ${t.visible ? 'animate-in slide-in-from-top-4' : 'animate-out slide-out-to-top-4'}`}>
        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bell size={18} />
        </div>
        <div>
          <p className="font-black text-sm">New Order!</p>
          <p className="text-xs text-gray-400">From {data?.customerName ?? 'a customer'}</p>
        </div>
      </div>
    ), { duration: 5000 });
    
    if (data?.orderId) setNewOrderIds(prev => new Set(Array.from(prev).concat(data.orderId)));
    refetch();
  });

  const orders = data?.orders ?? [];
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Orders
            {pendingCount > 0 && (
              <span className="text-sm font-black bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center animate-bounce">
                {pendingCount}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-400 text-sm">Manage and fulfill customer orders in real-time</p>
            <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isConnected ? 'Real-time Live' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
            <button 
              onClick={() => setLanguage('ENGLISH')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${language === 'ENGLISH' ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Globe size={12} /> EN
            </button>
            <button 
              onClick={() => setLanguage('TAMIL')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${language === 'TAMIL' ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Globe size={12} /> தமிழ்
            </button>
          </div>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-500 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-5 py-4 rounded-2xl">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-white" />
          </div>
          <div>
            <p className="font-black text-amber-800 text-sm">You have {pendingCount} new order{pendingCount > 1 ? 's' : ''} waiting!</p>
            <p className="text-xs text-amber-600">Accept or reject them to keep customers informed.</p>
          </div>
          <button onClick={() => setActiveTab('PENDING')} className="ml-auto text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors">
            View Pending
          </button>
        </div>
      )}

      {/* Tab Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 text-xs font-black px-4 py-2 rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-brand-200 hover:text-brand-500'
            }`}
          >
            {STATUS_CONFIG[tab].label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500 w-10 h-10" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 text-center">
          <ShoppingBag size={44} className="text-gray-200 mb-4" />
          <p className="font-black text-gray-700">No {activeTab !== 'ALL' ? STATUS_CONFIG[activeTab].label.toLowerCase() : ''} orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders from customers will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const isNew = newOrderIds.has(order.id);
            const isExpanded = expandedId === order.id;
            const cfg = STATUS_CONFIG[order.status];
            
            return (
              <div key={order.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                isNew ? 'border-brand-400 shadow-brand-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}>
                {/* Order Header Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => { 
                    setExpandedId(isExpanded ? null : order.id); 
                    setNewOrderIds(p => { 
                      const n = new Set(p); 
                      n.delete(order.id); 
                      return n; 
                    }); 
                  }}
                >
                  {isNew && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 animate-ping" />}
                  
                  {/* Order ID & Date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                      <OrderStatusBadge status={order.status} />
                      {isNew && <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">NEW</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.user.name} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {/* Total */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-gray-900 flex items-center gap-0.5">
                      <IndianRupee size={14} />{order.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-50 bg-gray-50/50 p-5 space-y-5">
                    <div className="grid sm:grid-cols-3 gap-5">
                      {/* Items */}
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Items Ordered</p>
                        <div className="space-y-1.5">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700">{item.quantity}× {item.name}</span>
                              <span className="font-bold text-gray-900">₹{item.total.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Delivery</span><span>₹{order.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-1">
                              <span>Total</span><span>₹{order.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-emerald-600 font-bold">
                              <span>Your earnings</span><span>₹{order.vendorAmount.toFixed(2)}</span>
                            </div>
                            {order.utrNumber && (
                              <div className="bg-brand-50 p-2.5 rounded-xl mt-3 border border-brand-100">
                                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-0.5">Customer UTR (Verification Pending)</p>
                                <p className="text-xs font-mono font-bold text-brand-900 tracking-wider">{order.utrNumber}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Delivery</p>
                        <div className="space-y-1.5">
                          <p className="font-bold text-sm text-gray-800">{order.user.name}</p>
                          <p className="text-xs text-gray-600 flex items-start gap-1.5">
                            <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br/>
                            {order.address.city} - {order.address.pincode}
                          </p>
                          
                          {order.deliveryPartner && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Assigned Partner</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900">{order.deliveryPartner.name}</span>
                                <a href={`tel:${order.deliveryPartner.phone}`} className="text-blue-600">
                                  <Phone size={14} fill="currentColor" />
                                </a>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                             {order.user.phone && (
                                <>
                                  <a href={`tel:${order.user.phone}`} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-200 transition-all">
                                    <Phone size={12} /> {order.user.phone}
                                  </a>
                                  
                                  <a 
                                    href={getWhatsAppUrl(order.user.phone, WHATSAPP_TEMPLATES[language].ORDER_UPDATE(order.id, order.status, vendorProfile?.shopName || 'Deeshora'))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
                                  >
                                    <Send size={12} /> Notify
                                  </a>
                                  <a 
                                    href={getWhatsAppUrl(order.user.phone, WHATSAPP_TEMPLATES[language].LOCATION_REQUEST(order.id, vendorProfile?.shopName || 'Deeshora'))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-all"
                                  >
                                    <MapPin size={12} /> Get Location
                                  </a>
                                  {order.paymentStatus === 'PAID' && (
                                    <a 
                                      href={getWhatsAppUrl(order.user.phone, WHATSAPP_TEMPLATES[language].INVOICE_SHARE(order.id, vendorProfile?.shopName || 'Deeshora', `${window.location.origin}/${language === 'ENGLISH' ? 'en' : 'ta'}/orders/${order.id}/invoice`))}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-all"
                                    >
                                      <FileText size={12} /> Share Invoice
                                    </a>
                                  )}
                                  {order.paymentStatus === 'PENDING' && vendorProfile?.upiId && (
                                    <a 
                                      href={getWhatsAppUrl(order.user.phone, WHATSAPP_TEMPLATES[language].PAYMENT_REQUEST(
                                        order.id, 
                                        vendorProfile?.shopName || 'Deeshora', 
                                        order.total,
                                        getUPILink(vendorProfile.upiId, vendorProfile.shopName, order.total, order.id)
                                      ))}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-brand-100 transition-all"
                                    >
                                      <IndianRupee size={12} /> Request Pay
                                    </a>
                                  )}
                                </>
                             )}
                          </div>
                          {order.notes && (
                            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                              💬 Note: {order.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Actions</p>
                        <div className="space-y-2">
                          {cfg.next && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: cfg.next! })}
                              disabled={updateStatusMutation.isPending}
                              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-60"
                            >
                              {updateStatusMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                              {cfg.nextLabel}
                            </button>
                          )}
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'CANCELLED' })}
                              disabled={updateStatusMutation.isPending}
                              className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={15} /> Reject Order
                            </button>
                          )}
                          {['DELIVERED', 'CANCELLED'].includes(order.status) && (
                            <p className="text-center text-xs text-gray-400 py-2">Order {order.status.toLowerCase()}</p>
                          )}
                          
                          {order.paymentStatus === 'PENDING' && order.paymentMethod === 'MANUAL_UPI' && (
                            <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                               <p className="text-[10px] font-black uppercase text-gray-400">Payment Reconciliation</p>
                               <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => verifyPaymentMutation.mutate({ orderId: order.id, status: 'PAID' })}
                                    disabled={verifyPaymentMutation.isPending}
                                    className="py-2 bg-emerald-500 text-white font-black text-xs rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                                  >
                                    {verifyPaymentMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    Confirm Paid
                                  </button>
                                  <button
                                    onClick={() => verifyPaymentMutation.mutate({ orderId: order.id, status: 'FAILED' })}
                                    disabled={verifyPaymentMutation.isPending}
                                    className="py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <XCircle size={12} /> Mark Failed
                                  </button>
                               </div>
                            </div>
                          )}
                          
                          {/* WhatsApp Coordination */}
                          {['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                            <div className="pt-2 border-t border-gray-100 mt-2">
                              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">WhatsApp Coordination</p>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    const partners = config?.find((c: any) => c.key === 'delivery_partners')?.value?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
                                    const partnerNumber = partners[0] || '918939318865';
                                    
                                    const message = `🛵 *NEW DELIVERY ORDER*\n\n*Shop:* ${vendorProfile?.shopName}\n*Order:* #${order.id.slice(-8).toUpperCase()}\n*Customer:* ${order.user.name}\n*Phone:* ${order.user.phone}\n*Address:* ${order.address.line1}, ${order.address.city}\n*Total:* ₹${order.total}\n*Pay Status:* ${order.paymentStatus}\n\n*Delivery Note:* ${order.notes || 'None'}\n\nPlease deliver this order! 🚀`;
                                    
                                    const url = getWhatsAppUrl(partnerNumber, message);
                                    window.open(url, '_blank');
                                  }}
                                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                                >
                                  <Phone size={14} fill="currentColor" /> Send to Partner
                                </button>
                                
                                {order.user.phone && (
                                  <>
                                    <button
                                      onClick={() => {
                                        const message = `Hi ${order.user.name.split(' ')[0]}! 🌟\n\nThank you for ordering from *${vendorProfile?.shopName}* (via Deeshora)! \n\nYour order #${order.id.slice(-8).toUpperCase()} is currently *${STATUS_CONFIG[order.status].label}*. We are working hard to deliver it to you! \n\nHave a great day! 🙏`;
                                        window.open(`https://wa.me/${order.user.phone}?text=${encodeURIComponent(message)}`, '_blank');
                                      }}
                                      className="w-full py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 font-bold text-[10px] rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                      <Bell size={12} /> Send &quot;Thank You&quot;
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => {
                                          const url = getWhatsAppUrl(order.user.phone!, WHATSAPP_TEMPLATES[language].ORDER_DELAYED(order.id, vendorProfile?.shopName || 'Deeshora'));
                                          window.open(url, '_blank');
                                        }}
                                        className="py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5"
                                      >
                                        <Clock size={12} /> Notify Delay
                                      </button>
                                      <button
                                        onClick={() => {
                                          const url = getWhatsAppUrl(order.user.phone!, `Hi ${order.user.name.split(' ')[0]}! This is ${vendorProfile?.shopName}. Just wanted to check if you received your order and if everything is to your satisfaction? 🙏`);
                                          window.open(url, '_blank');
                                        }}
                                        className="py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5"
                                      >
                                        <CheckCircle size={12} /> Follow Up
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
